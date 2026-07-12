const { createClient } = require('@supabase/supabase-js');
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  const { error } = await supabase.from('edges').delete().eq('label', 'test');
  console.log('Delete error:', error);
  
  // Dump edges again
  const { data } = await supabase.from('edges').select('*');
  console.log('Remaining Edges:', data);
}

cleanup();
