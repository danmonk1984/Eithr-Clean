"use client";

import { useState } from "react";

export default function VoteButtonsYesNo({ id, disabled }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function vote(which) {
    if (disabled || isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/poll/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice: which }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Could not submit vote.");
        setIsSubmitting(false);
        return;
      }

      // Refresh the page data (server component)
      window.location.reload();
    } catch (err) {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  const isDisabled = disabled || isSubmitting;

  return (
    <div style={{ marginTop: 12 }}>
      {error && (
        <div
          style={{
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
            background: "#fee",
            border: "1px solid #f99",
            color: "#900",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <button
          onClick={() => vote("A")}
          disabled={isDisabled}
          className="btn btn-yes"
          style={{
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Submitting…" : "Yes"}
        </button>

        <button
          onClick={() => vote("B")}
          disabled={isDisabled}
          className="btn btn-no"
          style={{
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Submitting…" : "No"}
        </button>
      </div>
    </div>
  );
}
