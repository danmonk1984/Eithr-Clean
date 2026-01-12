import { prisma } from '../../../lib/prisma.js';
import { createPollSchema } from '../../../lib/validation.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const data = createPollSchema.parse(body);

    const now = new Date();
    const closesAt = new Date(now.getTime() + data.durationMinutes * 60_000);

    const poll = await prisma.poll.create({
      data: {
        prompt: data.prompt,
        mode: data.mode,
        optionAImg: data.optionAImg,
        optionBImg: data.optionBImg,
        opensAt: now,
        closesAt
      }
    });

    return new Response(JSON.stringify({ id: poll.id }), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Invalid request' }), { status: 400 });
  }
}
