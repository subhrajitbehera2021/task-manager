const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    "https://yamytpjuaezppgwugsor.supabase.co",
    "sb_publishable_hNQF8DSuzflzxtc4M6sr3g_5wdScKEj"
);

module.exports = supabase;