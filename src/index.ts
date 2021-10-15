import { handleRequest } from './handler'
import { handleScheduled } from './cron'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request, event))
})

addEventListener('scheduled', (event) => {
  event.waitUntil(handleScheduled())
})
