const CACHE = 'todoit-v2'

const PRECACHE = [
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Skip API routes — always fresh
  if (url.pathname.startsWith('/api/')) return

  // Cache-first for Next.js static chunks and public assets
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached ||
        fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE).then(cache => cache.put(request, clone))
          }
          return response
        })
      )
    )
    return
  }

  // Network-first for pages — fall back to cache if offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
  }
})

// Push notifications
self.addEventListener('push', event => {
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})
