import Link from "next/link";
import { supabaseServer } from "../../../lib/supabase-server";
import VoteCard from "../../../components/VoteCard";
import VoteButtonsYesNo from "../../../components/VoteButtonsYesNo";
import { prisma } from "../../../lib/prisma";

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

export default async function PollPage({ params }) {
  // 1) Logged-in user (if any)
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id || null;

  // 2) Poll + votes
  const poll = await prisma.poll.findUnique({
    where: { id: params.id },
    include: { votes: true },
  });

  if (!poll) {
    return (
      <main>
        <p>Not found.</p>
        <Link href="/" className="btn btn-neutral" style={{ marginTop: 12 }}>
          Back to feed
        </Link>
      </main>
    );
  }

  // 3) State checks
  const isMine = !!poll.creatorId && !!currentUserId && poll.creatorId === currentUserId;
  const myVote = currentUserId
    ? poll.votes.find((v) => v.userId === currentUserId) || null
    : null;
  const hasVoted = !!myVote;

  const now = new Date();
  const closed = now >= poll.closesAt;
  const canVote = !closed && !isMine && !hasVoted;

  // 4) Display helpers
  const postedBy = isMine ? "you" : (poll.creatorEmail || "Unknown");

  const blockMessage =
    (isMine && "You can’t vote on your own poll.") ||
    (hasVoted && "You’ve already voted on this poll.") ||
    (closed && "This poll is closed.");

  const ended = closed;
  const timeLeft = formatTimeLeft(new Date(poll.closesAt) - now);

  const statusLabel = ended ? "ENDED" : "OPEN";
  const statusStyle = ended
    ? { borderColor: "#e5e7eb", color: "#6b7280", background: "#fff" }
    : { borderColor: "rgba(22,163,74,0.25)", color: "#166534", background: "rgba(22,163,74,0.08)" };

  // 5) Results
  const total = poll.votes.length;
  const aCount = poll.votes.filter((v) => v.choice === "A").length;
  const bCount = total - aCount;

  const myVoteLabel = myVote
    ? (poll.mode === "YES_NO"
        ? (myVote.choice === "A" ? "Yes" : "No")
        : myVote.choice)
    : null;

  return (
    <main className="space-y-3" style={{ display: "grid", gap: 12 }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <Link href="/" className="btn btn-neutral inline" style={{ padding: "10px 12px" }}>
          ← Feed
        </Link>

        <span className="badge" style={{ whiteSpace: "nowrap", ...statusStyle }}>
          {statusLabel}
        </span>
      </div>

      {/* Poll header */}
      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.25 }}>
          {poll.prompt}
        </div>

        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 10 }}>
          Posted by: {postedBy}
        </div>

        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          {ended
            ? `Ended ${new Date(poll.closesAt).toLocaleString()}`
            : `Closes ${new Date(poll.closesAt).toLocaleString()} • ${timeLeft}`}
        </div>

        {myVoteLabel && (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(14,165,233,0.08)",
              border: "1px solid rgba(14,165,233,0.25)",
              color: "#075985",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Your vote: {myVoteLabel}
          </div>
        )}

        {!canVote && !myVoteLabel && (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 12,
              background: "#f2f2f2",
              color: "#666",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            {blockMessage}
          </div>
        )}
      </div>

      {/* Voting UI */}
      {poll.mode === "A_B" ? (
        <div
          className="grid2"
          style={{
            pointerEvents: canVote ? "auto" : "none",
          }}
        >
          <VoteCard id={poll.id} which="A" label="A" img={poll.optionAImg} />
          <VoteCard id={poll.id} which="B" label="B" img={poll.optionBImg} />
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poll.optionAImg}
            alt="Option"
            style={{
              width: "100%",
              borderRadius: 14,
            }}
          />

          {canVote ? (
            <VoteButtonsYesNo id={poll.id} />
          ) : (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 12,
                background: "#f2f2f2",
                color: "#666",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              {blockMessage}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {closed ? (
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Results</h3>
          <p style={{ marginTop: 8 }}>
            {poll.mode === "YES_NO" ? "Yes" : "A"}: {aCount} (
            {total ? Math.round((aCount / total) * 100) : 0}%)
          </p>
          <p style={{ marginTop: 6 }}>
            {poll.mode === "YES_NO" ? "No" : "B"}: {bCount} (
            {total ? Math.round((bCount / total) * 100) : 0}%)
          </p>
          <p style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
            Total votes: {total}
          </p>
        </section>
      ) : (
        <p style={{ fontSize: 12, opacity: 0.75 }}>
          Results appear after closing.
        </p>
      )}
    </main>
  );
}
