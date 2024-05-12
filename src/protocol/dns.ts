export async function resolveSrv(name: string) {
  const params = new URLSearchParams({
    name,
    type: 'srv',
    ct: 'application/dns-json',
  })

  const res = await fetch(`https://cloudflare-dns.com/dns-query?${params}`, {
    headers: {
      Accept: 'application/dns-json',
    },
  })

  if (!res.ok) {
    console.error(`Invalid DNS response for ${name}: ${res.status}`)
    return undefined
  }

  const data = JSON.parse(await res.text())

  if (!data.Answer?.length) {
    console.error(`No DNS records for ${name}.`)
    return undefined
  }

  const answer: string = data.Answer[0].data
  const [, , port, hostname] = answer.split(' ')

  return hostname && port ? { hostname, port: Number(port) } : undefined
}
