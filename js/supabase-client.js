
const SUPABASE_URL = "https://obunhbnrxhysysrmumrb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_a9Zexy2efFImrJYvxkcvpw_W_rUUegp";

if (window.supabase && typeof window.supabase.createClient === "function") {
    window.supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
} else {
    console.warn("[CyberNexa] Supabase JS SDK not loaded yet.");
}