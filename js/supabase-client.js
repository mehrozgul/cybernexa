
const SUPABASE_URL = "https://obunhbnrxhysysrmumrb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_a9Zexy2efFImrJYvxkcvpw_W_rUUegp";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);