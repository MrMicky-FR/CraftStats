export async function resolveSrv(name: string) {
  const response = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${name}&type=srv&ct=application/dns-json`,
    {
      headers: {
        Accept: 'application/dns-json',
      },
    },
  )

  const json = await response.text()
  const data = JSON.parse(json)

  if (!data.Answer?.length) {
    return undefined
  }

  const answer: string = data.Answer[0].data
  const [, , port, hostname] = answer.split(' ')

  return hostname && port ? { hostname, port: Number(port) } : undefined
}
