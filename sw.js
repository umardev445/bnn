const CACHE='khatabanao-static-v1';
const FILES=['./','./index.html','./manifest.webmanifest','./sw.js','./assets/base.css','./assets/khata.css','./assets/app.mjs','./assets/core.mjs','./assets/store.mjs','./assets/config.js','./assets/i18n.mjs','./assets/icons.mjs','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./privacy.html','./terms.html','./help.html','./delete-data.html','./about.html','./contact.html'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('khatabanao-static-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(req.mode==='navigate'){
   event.respondWith(fetch(req).catch(async()=>await caches.match(req)||await caches.match('./index.html')));
 }else{
   event.respondWith(caches.match(req).then(hit=>hit||fetch(req)));
 }
});
