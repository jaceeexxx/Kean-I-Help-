import styles from"./brand-mark.module.css";
export function BrandMark({compact=false}:{compact?:boolean}){return <div className={styles.b}><img src="/assets/brand/logo-mark.png" alt="" aria-hidden="true"/><div><strong>Kean I Help<span>?</span></strong>{!compact&&<small>For Kean, by Jace.</small>}</div></div>}
