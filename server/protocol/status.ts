// This file is based on https://github.com/PassTheMayo/minecraft-server-util,
// under the MIT License, and adapted for Cloudflare Workers.

import { connect } from 'cloudflare:sockets'

import { resolveSrv } from './dns'

export interface StatusResult {
  players: {
    online: number
    max: number
  }
  favicon?: string
}

const DEFAULT_PORT = 25565

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export async function status(address: string, useSrv = true): Promise<StatusResult> {
  const [hostname, port] = parseAddress(address)

  if (useSrv && port === undefined) {
    const srv = await resolveSrv(`_minecraft._tcp.${hostname}`)

    if (srv) {
      return rawStatus(srv.hostname.replace(/\.$/, ''), srv.port)
    }
  }

  return rawStatus(hostname, port ?? DEFAULT_PORT)
}

async function rawStatus(hostname: string, port: number): Promise<StatusResult> {
  const socket = connect({ hostname, port })
  const writer = socket.writable.getWriter()
  const reader = socket.readable.getReader()

  try {
    await writer.write(handshakePacket(hostname, port))
    await writer.write(REQUEST_PACKET)

    // Response frame: [length][packetId 0x00][json length][json].
    // The string carries its own length, so the outer frame length is skipped.
    const packet = new PacketReader(reader)
    await packet.readVarInt() // packet length

    const packetId = await packet.readVarInt()
    if (packetId !== 0x00) {
      throw new Error(`Unexpected packet id: 0x${packetId.toString(16)}`)
    }

    return JSON.parse(await packet.readStringVarInt()) as StatusResult
  } finally {
    await reader.cancel().catch(() => {})
    await writer.close().catch(() => {})
    await socket.close().catch(() => {})
  }
}

/** Split an address into `[hostname, port?]`, handling bracketed IPv6. */
function parseAddress(address: string): [hostname: string, port?: number] {
  // Bracketed IPv6, optionally with a port, e.g. "[::1]" or "[::1]:25565".
  const bracketed = address.match(/^\[(.+)](?::(\d+))?$/)
  if (bracketed) {
    const [, hostname, port] = bracketed
    return port ? [hostname, Number(port)] : [hostname]
  }

  // Bare IPv6 (more than one colon) never carries a port.
  if (address.indexOf(':') !== address.lastIndexOf(':')) {
    return [address]
  }

  // "hostname" or "hostname:port".
  const [hostname, port] = address.split(':')
  return port ? [hostname, Number(port)] : [hostname]
}

class PacketWriter {
  private readonly chunks: Uint8Array[] = []

  writeVarInt(value: number): this {
    this.chunks.push(writeVarInt(value))
    return this
  }

  writeUint16(value: number): this {
    const bytes = new Uint8Array(2)
    new DataView(bytes.buffer).setUint16(0, value) // big-endian (network order)
    this.chunks.push(bytes)
    return this
  }

  writeString(value: string): this {
    const bytes = encoder.encode(value)
    this.chunks.push(writeVarInt(bytes.byteLength), bytes)
    return this
  }

  build(): Uint8Array {
    const body = concat(this.chunks)
    return concat([writeVarInt(body.byteLength), body])
  }
}

class PacketReader {
  private readonly queue: Uint8Array[] = []
  private head = 0 // read offset within queue[0]
  private available = 0 // unread bytes across the whole queue

  constructor(private readonly reader: ReadableStreamDefaultReader<Uint8Array>) {}

  async readByte(): Promise<number> {
    await this.fill(1)

    const chunk = this.queue[0]
    const byte = chunk[this.head++]
    this.consume(chunk, 1)

    return byte
  }

  async readBytes(length: number): Promise<Uint8Array> {
    await this.fill(length)

    const out = new Uint8Array(length)
    let written = 0

    while (written < length) {
      const chunk = this.queue[0]
      const take = Math.min(chunk.byteLength - this.head, length - written)

      out.set(chunk.subarray(this.head, this.head + take), written)
      written += take
      this.head += take
      this.consume(chunk, take)
    }

    return out
  }

  readVarInt(): Promise<number> {
    return readVarInt(() => this.readByte())
  }

  async readStringVarInt(): Promise<string> {
    const length = await this.readVarInt()
    if (length > 32_768) {
      throw new Error(`Declared string length too large: ${length}`)
    }
    return decoder.decode(await this.readBytes(length))
  }

  private async fill(length: number): Promise<void> {
    while (this.available < length) {
      const { value, done } = await this.reader.read()

      if (done) {
        throw new Error('Connection closed before the packet was complete.')
      }
      if (value.byteLength > 0) {
        this.queue.push(value)
        this.available += value.byteLength
      }
    }
  }

  /** Drop the head chunk once it has been fully read. */
  private consume(chunk: Uint8Array, count: number): void {
    this.available -= count

    if (this.head === chunk.byteLength) {
      this.queue.shift()
      this.head = 0
    }
  }
}

// Handshake packet — https://minecraft.wiki/w/Java_Edition_protocol/Server_List_Ping#Handshake
function handshakePacket(host: string, port: number): Uint8Array {
  return new PacketWriter()
    .writeVarInt(0x00) // packet id
    .writeVarInt(47) // 1.8 client version (the value is irrelevant for a status ping)
    .writeString(host)
    .writeUint16(port)
    .writeVarInt(1) // next state: status
    .build()
}

// Request packet (constant payload) - https://minecraft.wiki/w/Java_Edition_protocol/Server_List_Ping#Status_Request
const REQUEST_PACKET = new PacketWriter().writeVarInt(0x00).build()

function concat(chunks: readonly Uint8Array[]): Uint8Array {
  let total = 0
  for (const chunk of chunks) total += chunk.byteLength

  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }

  return out
}

async function readVarInt(readByte: () => Promise<number>): Promise<number> {
  let result = 0
  let shift = 0
  let byte: number

  do {
    if (shift >= 35) {
      throw new Error('VarInt is too large')
    }
    byte = await readByte()
    result |= (byte & 0x7f) << shift
    shift += 7
  } while (byte & 0x80)

  return result >>> 0
}

function writeVarInt(value: number): Uint8Array {
  const out = new Uint8Array(5) // a 32-bit VarInt is at most 5 bytes
  let i = 0
  let v = value >>> 0

  do {
    const byte = v & 0x7f
    v >>>= 7
    out[i++] = v === 0 ? byte : byte | 0x80
  } while (v !== 0)

  return out.subarray(0, i)
}
