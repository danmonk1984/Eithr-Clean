import { prisma } from "../../../lib/prisma.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";

// ----- Validation rules (simple + friendly) -----
const uploadSchema = z.object({
  mode: z.enum(["YES_NO", "A_B"]),
  prompt: z.string().min(5, "Question must be at least 5 characters.").max(140, "Question is too long."),
  durationMinutes: z.coerce
    .number()
    .int("Duration must be a whole number.")
    .min(5, "Duration must be at least 5 minutes.")
    .max(10080, "Duration is too long."),
});

// IMPORTANT: you are using the service role key server-side to upload to Storage.
// Do not expose this in client code.
const storageAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = process.env.SUPABASE_BUCKET || "images";

// File limits (MVP-friendly defaults)
const MAX_FILE_BYTES = 6 * 1024 * 1024; // 6MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function saveFileToSupabase(file) {
  // Basic file validation
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Please upload a JPG, PNG, WebP, or GIF image.");
  }
  if (typeof file.size === "number" && file.size > MAX_FILE_BYTES) {
    throw new Error("Image is too large. Please upload an image under 6MB.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);

  const ext = (file.name?.split(".").pop() || "jpg").slice(0, 8);
  const key = `polls/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await storageAdmin.storage.from(BUCKET).upload(key, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = storageAdmin.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

export async function POST(req) {
  try {
    // 1) Require login to create polls
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return jsonError("Sign in required.", 401);

    // 2) Read form data
    const form = await req.formData();
    const mode = form.get("mode");
    const prompt = form.get("prompt");
    const durationMinutes = form.get("durationMinutes");

    // 3) Validate text fields
    const parsed = uploadSchema.safeParse({ mode, prompt, durationMinutes });
    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message || "Invalid form data.";
      return jsonError(msg, 400);
    }
    const data = parsed.data;

    // 4) Validate files exist
    const fileA = form.get("fileA");
    const fileB = form.get("fileB");

    if (!fileA || typeof fileA === "string") {
      return jsonError("Please upload an image.", 400);
    }
    if (data.mode === "A_B" && (!fileB || typeof fileB === "string")) {
      return jsonError("Please upload both images for an A/B poll.", 400);
    }

    // 5) Upload images
    const aUrl = await saveFileToSupabase(fileA);
    const bUrl = data.mode === "A_B" ? await saveFileToSupabase(fileB) : null;

    // 6) Create poll record
    const now = new Date();
    const closesAt = new Date(now.getTime() + data.durationMinutes * 60_000);

    if (!(closesAt instanceof Date) || isNaN(closesAt.getTime())) {
      return jsonError("Invalid closing time.", 400);
    }
    if (closesAt <= now) {
      return jsonError("Poll must close in the future.", 400);
    }

    const poll = await prisma.poll.create({
      data: {
        prompt: data.prompt,
        mode: data.mode,
        optionAImg: aUrl,
        optionBImg: bUrl || undefined,
        opensAt: now,
        closesAt,
        creatorId: user.id,
        creatorEmail: user.email || null,
      },
    });

    // 7) Return JSON so the client can redirect cleanly
    return new Response(JSON.stringify({ id: poll.id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e?.message || "Invalid request.";
    return jsonError(msg, 400);
  }
}
