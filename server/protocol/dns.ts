interface CloudflareDnsResponse {
  Answer?: { name: string; data: string }[]
}

export async function resolveSrv(name: string) {
  const params = new URLSearchParams({ name, type: 'srv' })
  const res = await fetch(`https://cloudflare-dns.com/dns-query?${params}`, {
    headers: {
      Accept: 'application/dns-json',
    },
  })

  if (!res.ok) {
    console.warn(`Invalid DNS response for ${name}: ${res.status}`)
    return undefined
  }

  // DNS response only contains SRV records as type is specified in request
  const dnsResponse = await res.json<CloudflareDnsResponse>()
  const srvRecords = dnsResponse.Answer ?? []

  if (!srvRecords.length) {
    console.info(`No SRV DNS records for ${name}.`)
    return undefined
  }

  // Find record with lowest priority (SRV format "priority weight port target")
  const [, , port, hostname] = srvRecords
    .map((record) => record.data.split(' '))
    .reduce((a, b) => (Number(a[0]) <= Number(b[0]) ? a : b))

  return hostname && port ? { hostname, port: Number(port) } : undefined
}
