import { prisma } from "../../../../../lib/prisma";
import { supabaseServer } from "../../../../../lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  try {
    // 1) Load the poll (we need it for opens/closes AND creatorId)
    const poll = await prisma.poll.findUnique({
      where: { id: params.id },
      select: { id: true, opensAt: true, closesAt: true, creatorId: true },
    });

    if (!poll) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    // 2) Check it’s open
    const now = new Date();
    if (now < poll.opensAt) {
      return new Response(JSON.stringify({ error: "Not open yet" }), { status: 400 });
    }
    if (now >= poll.closesAt) {
      return new Response(JSON.stringify({ error: "Poll closed" }), { status: 400 });
    }

    // 3) WHO IS VOTING?
    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Sign in required" }), { status: 401 });
    }

    // 4) Block voting on your own poll
    if (poll.creatorId && poll.creatorId === user.id) {
      return new Response(JSON.stringify({ error: "You cannot vote on your own poll." }), { status: 403 });
    }

    // 5) Validate the choice
    const { choice } = await req.json();
    if (choice !== "A" && choice !== "B") {
      return new Response(JSON.stringify({ error: "Invalid choice" }), { status: 400 });
    }

    // 6) Enforce one vote per user per poll
    const existing = await prisma.vote.findFirst({
      where: { pollId: poll.id, userId: user.id },
    });

    if (existing) {
      return new Response(JSON.stringify({ error: "You already voted" }), { status: 409 });
    }

    // 7) Save the vote
    await prisma.vote.create({
      data: { pollId: poll.id, choice, userId: user.id },
    });

    return new Response(JSON.stringify({ ok: true }), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Invalid request" }), { status: 400 });
  }
}
