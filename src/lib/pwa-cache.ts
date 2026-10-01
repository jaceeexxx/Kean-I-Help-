export async function clearPrivateNavigationCache(){
  if(typeof window==="undefined")return;
  try{
    navigator.serviceWorker?.controller?.postMessage({type:"CLEAR_PRIVATE_CACHES"});
  }catch{}
  try{
    if("caches" in window){
      for(const name of await caches.keys())if(name.startsWith("kih-v2-private-nav"))await caches.delete(name);
    }
  }catch{}
}
