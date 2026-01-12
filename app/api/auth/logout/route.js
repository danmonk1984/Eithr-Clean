import { supabaseServer } from '../../../../lib/supabase-server';

export async function POST() {
  const supabase = supabaseServer();
  await supabase.auth.signOut();
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

