const CACHE="kih-v2-final-shell-v20-journal";
const PRIVATE_CACHE="kih-v2-private-nav-v20";
const SAFE_SHELL=[
  "/offline",
  "/manifest.webmanifest",
  "/assets/brand/icon-192.png",
  "/assets/brand/icon-512.png",
  "/assets/brand/icon-maskable-512.png",
  "/assets/brand/apple-touch-icon.png",
  "/assets/jace/mini/nav.png"
];
const OFFLINE_NAV=[
  /^\/$/,
  /^\/review(?:\/.*)?$/,
  /^\/practice(?:\/.*)?$/,
  /^\/progress(?:\/.*)?$/,
  /^\/jace(?:\/.*)?$/,
  /^\/profile$/,
  /^\/settings(?:\/.*)?$/
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SAFE_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys
    .filter(key=>key.startsWith("kih-")&&key!==CACHE&&key!==PRIVATE_CACHE)
    .map(key=>caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("message",event=>{
  const type=event.data?.type;
  if(type==="SKIP_WAITING")self.skipWaiting();
  if(type==="CLEAR_PRIVATE_CACHES")event.waitUntil(caches.delete(PRIVATE_CACHE));
});

function canCacheNavigation(path){return OFFLINE_NAV.some(re=>re.test(path));}

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith("/api/")||url.pathname.startsWith("/auth/"))return;

  if(request.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request);
        if(response.ok&&canCacheNavigation(url.pathname)&&!url.search){
          const cache=await caches.open(PRIVATE_CACHE);
          await cache.put(request,response.clone());
        }
        return response;
      }catch{
        if(canCacheNavigation(url.pathname)){
          const cached=await caches.match(request,{ignoreSearch:true});
          if(cached)return cached;
        }
        return await caches.match("/offline")||Response.error();
      }
    })());
    return;
  }

  const staticAsset=url.pathname.startsWith("/_next/static/")||
    url.pathname.startsWith("/assets/")||
    url.pathname==="/manifest.webmanifest";
  if(staticAsset){
    event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
      if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));
      return response;
    })));
  }
});

self.addEventListener("push",event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch{data={body:event.data?.text()||""}}
  const title=data.title||"Kean I Help?";
  event.waitUntil(self.registration.showNotification(title,{
    body:data.body||"Your review is here when you’re ready.",
    icon:"/assets/brand/icon-192.png",
    badge:"/assets/brand/icon-192.png",
    tag:data.tag||"kih-push",
    renotify:false,
    data:{url:data.url||"/"}
  }));
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const url=new URL(event.notification.data?.url||"/",self.location.origin).href;
  event.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(clients=>{
    for(const client of clients){
      if(client.url.startsWith(self.location.origin)&&"focus" in client){
        client.navigate(url);
        return client.focus();
      }
    }
    return self.clients.openWindow?self.clients.openWindow(url):undefined;
  }));
});
