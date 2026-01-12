import Link from "next/link";
import { prisma } from "../lib/prisma";
import { supabaseServer } from "../lib/supabase-server";

export const revalidate = 0;

function formatTimeLeft(ms) {
  if (ms <= 0) return "Ended";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return `${hrs}h ${remMins}m left`;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return `${days}d ${remHrs}h left`;
}

export default async function Home() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id || null;

  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  // Sort: open polls first, ended polls after (still keeps "newer first" inside each group)
  const sorted = [...polls].sort((a, b) => {
    const aEnded = now >= new Date(a.closesAt);
    const bEnded = now >= new Date(b.closesAt);
    if (aEnded !== bEnded) return aEnded ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <main className="space-y-4">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h1>Feed</h1>
        <Link href="/create" className="btn btn-neutral inline">
          Create
        </Link>
      </div>

      {sorted.length === 0 && <p>No polls yet. Create one to get started.</p>}

      <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0, margin: 0 }}>
        {sorted.map((poll) => {
          const isMine =
            poll.creatorId && currentUserId && poll.creatorId === currentUserId;

          const ended = now >= new Date(poll.closesAt);
          const timeLeft = formatTimeLeft(new Date(poll.closesAt) - now);

          const title = poll.question || poll.title || poll.prompt || "Untitled poll";
          const postedBy = isMine ? "you" : (poll.creatorEmail || "Unknown");

          return (
            <li key={poll.id}>
              {/* Make the entire card tappable */}
              <Link
                href={`/poll/${poll.id}`}
                className="card"
                style={{
                  display: "block",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 800, lineHeight: 1.25 }}>
                    {title}
                  </div>

                  <span
                    className="badge"
                    style={{
                      whiteSpace: "nowrap",
                      borderColor: ended ? "#e5e7eb" : "rgba(22,163,74,0.25)",
                      color: ended ? "#6b7280" : "#166534",
                      background: ended ? "#fff" : "rgba(22,163,74,0.08)",
                    }}
                  >
                    {ended ? "ENDED" : "OPEN"}
                  </span>
                </div>

                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                  Posted by: {postedBy}
                </div>

                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                  {ended
                    ? `Ended ${new Date(poll.closesAt).toLocaleString()}`
                    : `Closes ${new Date(poll.closesAt).toLocaleString()} • ${timeLeft}`}
                </div>

                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
                  Tap to open →
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
