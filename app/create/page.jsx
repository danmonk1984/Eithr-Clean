import Link from 'next/link';
import { supabaseServer } from '../../lib/supabase-server';
import CreateForm from './CreateForm';

export default async function CreatePage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main style={{ display: 'grid', gap: 12 }}>
        <h2>Create</h2>
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <p>You need to be signed in to post a poll.</p>
          <Link className="btn btn-neutral" href="/login">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return <CreateForm />;
}
