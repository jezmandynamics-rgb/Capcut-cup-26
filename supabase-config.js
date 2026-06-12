// Your Supabase project — anon (publishable) key, safe to expose in browser.
const SUPABASE_URL = "https://wsjbznastipyldnavhtw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzamJ6bmFzdGlweWxkbmF2aHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExOTIzMTksImV4cCI6MjA5Njc2ODMxOX0._5rBb3aNLPylxsUTkNEZcYXv47QdaxDZbUFpd1LLT_M";

window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
