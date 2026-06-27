interface Env {
  ASSETS: Fetcher
  KV_SERVERS: KVNamespace
  PING_ATTEMPTS: string
  RECENT_DELETE_AFTER_MIN: string
  GLOBAL_PING_INTERVAL: string
  GLOBAL_DELETE_AFTER_DAYS: string
  WEBHOOK_URL?: string
  SERVERS_EDIT_TOKEN?: string
  PING_ALIASES?: string
  STATUS_URL?: string
  BEDROCK_STATUS_URL?: string
}

declare module '*.svg' {
  const svg: string
  export default svg
}
