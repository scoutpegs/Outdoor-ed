const CACHE="pinboard-gs-v2";
const SHELL=["./","./index.html","./styles.css","./app.js","./manifest.json","./share-handler.html","./icon.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url); if(e.request.method!=="GET")return;
  if(u.hostname.includes("script.google.com")||u.hostname.includes("googleusercontent.com")||u.hostname.includes("youtube.com")||u.hostname.includes("tiktok.com")||u.hostname.includes("instagram.com")||u.hostname.includes("pinterest.com")||u.hostname.includes("squarespace-cdn.com"))return;
  e.respondWith(caches.match(e.request).then(cached=>{
    const fresh=fetch(e.request).then(r=>{if(r.ok&&u.origin===self.location.origin){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return r}).catch(()=>cached);
    return cached||fresh;
  }));
});