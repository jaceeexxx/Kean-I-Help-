export type JacePreferences={dailyMessagesEnabled:boolean;stickerReactionsEnabled:boolean};
const KEY="kih:jace-preferences:v1";
export const defaultJacePreferences:JacePreferences={dailyMessagesEnabled:true,stickerReactionsEnabled:true};
export function loadJacePreferences():JacePreferences{if(typeof window==="undefined")return defaultJacePreferences;try{return{...defaultJacePreferences,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return defaultJacePreferences}}
export function saveJacePreferences(value:JacePreferences){if(typeof window!=="undefined"){localStorage.setItem(KEY,JSON.stringify(value));window.dispatchEvent(new Event("jace:preferences"))}}
