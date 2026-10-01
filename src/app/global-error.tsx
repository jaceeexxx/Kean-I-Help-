"use client";
export default function GlobalError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <html lang="en"><body style={{fontFamily:"system-ui",padding:32}}><main><h1>Kean I Help? needs a reload.</h1><p>The app shell failed to render, but browser-stored study data is separate from this screen.</p><button onClick={reset}>Reload app</button></main></body></html>}
