import { status, statusBedrock } from 'minecraft-server-util'
import { Event, Handler, Response } from 'scaleway-functions'

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return {
    statusCode: status,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  }
}

async function ping(host: string, isBedrock = false) {
  try {
    const response = await (isBedrock
      ? statusBedrock(host, { timeout: 500 })
      : status(host, { timeout: 500 }))

    delete response['rawResponse']
    delete response['serverGUID']

    return { status: true, ...response }
  } catch (e) {
    return { status: false, error: e?.toString() }
  }
}

export const handle: Handler = async (event: Event) => {
  const path = event.path

  if (!path.startsWith('/ping/') && !path.startsWith('/ping-bedrock/')) {
    return jsonResponse({ error: 'Invalid path' }, 404)
  }

  const bedrock = path.startsWith('/ping-bedrock/')
  const host = path.replace(bedrock ? '/ping-bedrock/' : '/ping/', '')

  if (!host) {
    return jsonResponse({ error: 'Missing host' }, 404)
  }

  return jsonResponse(await ping(host, bedrock))
}
