const CACHE = 'todoit-v3'

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

  // Network-first for pages — always return a valid Response
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        // Return a minimal offline page rather than undefined (which crashes the PWA)
        return new Response(
          '<html><body style="background:#0f172a;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px"><p style="font-size:1.1rem">Geen verbinding</p><button onclick="location.reload()" style="padding:10px 24px;background:#4f46e5;color:white;border:none;border-radius:8px;cursor:pointer">Opnieuw proberen</button></body></html>',
          { status: 503, headers: { 'Content-Type': 'text/html' } }
        )
      })
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
