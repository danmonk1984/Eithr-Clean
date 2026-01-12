"use client";

import { useState } from "react";

export default function VoteCard({ id, which, label, img, disabled }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function vote() {
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

      window.location.reload();
    } catch (err) {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  const isDisabled = disabled || isSubmitting;

  return (
    <div
      className="card"
      style={{
        textAlign: "center",
        opacity: isDisabled ? 0.85 : 1,
      }}
    >
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

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt={label}
        style={{
          width: "100%",
          borderRadius: 14,
          opacity: isDisabled ? 0.6 : 1,
          transition: "opacity 0.2s ease",
        }}
      />

      <div style={{ marginTop: 12 }}>
        <button
          onClick={vote}
          disabled={isDisabled}
          className={`btn ${label === "A" ? "btn-yes" : "btn-no"}`}
          style={{
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Submitting…" : `Vote ${label}`}
        </button>
      </div>
    </div>
  );
}
