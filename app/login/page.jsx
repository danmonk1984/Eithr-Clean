"use client";

import { useState } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";

export default function LoginPage() {
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [msg, setMsg] = useState("");

  async function sendLink(e) {
    e.preventDefault();
    if (isSending) return;

    setMsg("");

    // basic friendly check before hitting the network
    if (!email.trim()) {
      setMsg("Please enter your email address.");
      return;
    }

    try {
      setIsSending(true);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        setMsg(error.message || "Could not send link. Please try again.");
        setIsSending(false);
        return;
      }

      setSent(true);
      setIsSending(false);
    } catch (err) {
      setMsg("Network error. Please try again.");
      setIsSending(false);
    }
  }

  return (
    <main style={{ display: "grid", gap: 12 }}>
      <h2>Sign in</h2>

      {!sent ? (
        <form onSubmit={sendLink} className="card" style={{ display: "grid", gap: 12 }}>
          <p style={{ fontSize: 12, opacity: 0.8, margin: 0 }}>
            We’ll email you a one-time sign-in link (no password).
          </p>

          <label style={{ display: "grid", gap: 6 }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={isSending}
              style={{ width: "100%" }}
            />
          </label>

          <button
            className="btn btn-neutral"
            disabled={isSending}
            style={{
              opacity: isSending ? 0.6 : 1,
              cursor: isSending ? "not-allowed" : "pointer",
            }}
          >
            {isSending ? "Sending…" : "Send magic link"}
          </button>

          {msg && (
            <div
              style={{
                padding: 10,
                borderRadius: 12,
                background: "#f2f2f2",
                color: "#444",
                fontSize: 12,
              }}
            >
              {msg}
            </div>
          )}
        </form>
      ) : (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Check your email</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            We sent a sign-in link to <b>{email}</b>.
          </div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            If you don’t see it, check spam/junk and try again.
          </div>

          <button
            className="btn btn-neutral"
            onClick={() => {
              setSent(false);
              setMsg("");
            }}
          >
            Use a different email
          </button>
        </div>
      )}
    </main>
  );
}
