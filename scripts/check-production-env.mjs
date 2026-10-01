const required=["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","OPENAI_API_KEY","NEXT_PUBLIC_VAPID_PUBLIC_KEY","VAPID_PRIVATE_KEY","SUPABASE_SERVICE_ROLE_KEY","CRON_SECRET"];
const optional=["OPENAI_MODEL","NEXT_PUBLIC_SITE_URL","VAPID_SUBJECT"];
const missing=required.filter(key=>!process.env[key]);
console.log("Kean I Help? production environment check");
for(const key of required)console.log(`${process.env[key]?"✓":"✗"} ${key}`);
for(const key of optional)console.log(`${process.env[key]?"✓":"·"} ${key} (optional/configurable)`);
if(missing.length){console.error(`\nMissing ${missing.length} required production variable${missing.length===1?"":"s"}.`);process.exit(1)}
console.log("\n✓ Required production environment is present.");
