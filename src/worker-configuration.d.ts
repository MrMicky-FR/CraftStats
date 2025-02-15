interface Env {
  KV_SERVERS: KVNamespace
  PING_ATTEMPTS: number
  RECENT_DELETE_AFTER_MIN: number
  GLOBAL_PING_INTERVAL: number
  GLOBAL_DELETE_AFTER_DAYS: number
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
