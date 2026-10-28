/* Service worker do app de rota: sempre tenta a versão nova e usa o cache só sem internet. */
const CACHE="rota-v1";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET") return;
  const url=new URL(req.url);
  if(url.origin===self.location.origin){
    e.respondWith(
      fetch(req,{cache:"no-cache"}).then(r=>{
        if(r.ok){const copy=r.clone(); caches.open(CACHE).then(c=>c.put(req,copy))}
        return r;
      }).catch(()=>caches.match(req).then(c=>c||caches.match("./index.html")))
    );
  }else if(url.hostname==="unpkg.com"){
    // Leaflet (versão fixa): guarda para o mapa abrir também sem internet.
    e.respondWith(caches.match(req).then(c=>c||fetch(req).then(r=>{
      if(r.ok||r.type==="opaque"){const copy=r.clone(); caches.open(CACHE).then(cc=>cc.put(req,copy))}
      return r;
    })));
  }
  // rotas (OSRM) e mapas (OpenStreetMap) passam direto, sem cache.
});
