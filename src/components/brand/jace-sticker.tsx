export type JaceStickerMood="default"|"thinking"|"explaining"|"proud"|"gentle"|"focus"|"celebrate"|"rest"|"confused"|"exam-done";
export function JaceSticker({mood="default",size=64,className=""}:{mood?:JaceStickerMood;size?:number;className?:string}){return <img className={className} src={`/assets/jace/stickers/${mood}.png`} width={size} height={size} alt="" aria-hidden="true"/>}
