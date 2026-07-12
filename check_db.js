const { createClient } = require('@supabase/supabase-js');
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { error: nodeError } = await supabase.from('nodes').insert([{ label: 'test2', group: 'event' }]);
  console.log('Nodes insert error:', nodeError);
  
  // Cleanup dummy rows
  await supabase.from('edges').delete().eq('label', 'test');
  await supabase.from('nodes').delete().eq('label', 'test2');
}

checkSchema();
