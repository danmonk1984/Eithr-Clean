"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateForm() {
  const router = useRouter();

  const [mode, setMode] = useState("YES_NO");
  const [prompt, setPrompt] = useState("");
  const [minutes, setMinutes] = useState(60);

  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");

  const needB = mode === "A_B";

  async function handleSubmit(e) {
    e.preventDefault();
    if (isPosting) return;

    setError("");
    setIsPosting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      // ensure these match state
      formData.set("mode", mode);
      formData.set("prompt", prompt);
      formData.set("durationMinutes", String(minutes));

      const res = await fetch("/api/polls-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Something went wrong posting your poll.");
        setIsPosting(false);
        return;
      }

      const newId = data?.id;
      if (newId) {
        router.push(`/poll/${newId}`);
        router.refresh();
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setIsPosting(false);
    }
  }

  return (
    <main>
      <h2>Create a new poll</h2>

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#fee",
            border: "1px solid #f99",
            color: "#900",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Poll type
          <select
            name="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            disabled={isPosting}
          >
            <option value="YES_NO">Yes / No (one image)</option>
            <option value="A_B">A / B (two images)</option>
          </select>
        </label>

        <label>
          Question
          <input
            name="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Should I wear this jacket?"
            maxLength={140}
            required
            disabled={isPosting}
          />
        </label>

        <label>
          {mode === "YES_NO" ? "Upload image" : "Upload image A"}
          <input name="fileA" type="file" accept="image/*" required disabled={isPosting} />
        </label>

        {needB && (
          <label>
            Upload image B
            <input name="fileB" type="file" accept="image/*" required disabled={isPosting} />
          </label>
        )}

        <label>
          Duration (minutes)
          <input
            name="durationMinutes"
            type="number"
            min={5}
            max={10080}
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value || "60", 10))}
            disabled={isPosting}
          />
        </label>

        <button className="btn btn-neutral" disabled={isPosting}>
          {isPosting ? "Posting…" : "Post dilemma"}
        </button>
      </form>
    </main>
  );
}
