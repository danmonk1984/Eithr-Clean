import "./globals.css";
import Link from "next/link";
import { supabaseServer } from "../lib/supabase-server";

export const metadata = {
  title: "Eithr",
  description: "Quick photo dilemmas",
};

export default async function RootLayout({ children }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#fafafa",
          color: "#111",
        }}
      >
        {/* Sticky header */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(250,250,250,0.9)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              padding: "10px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Link
              href="/"
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                minHeight: 44,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Eithr"
                width="38"
                height="38"
                style={{ borderRadius: 12 }}
              />
              <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.2 }}>
                Eithr
              </span>
            </Link>

            <nav style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {/* Feed now matches Create styling */}
              <Link
                href="/"
                className="btn btn-neutral inline"
                style={{ padding: "10px 12px", minHeight: 44 }}
              >
                Feed
              </Link>

              <Link
                href="/create"
                className="btn btn-neutral inline"
                style={{ padding: "10px 12px", minHeight: 44 }}
              >
                Create
              </Link>

              {user ? (
                <>
                  {/* Hide email on small screens to keep header clean */}
                  <span
                    style={{
                      fontSize: 12,
                      opacity: 0.7,
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "none",
                    }}
                    className="hide-on-mobile"
                    title={user.email || ""}
                  >
                    {user.email}
                  </span>

                  <form action="/api/auth/logout" method="post">
                    <button
                      className="btn btn-neutral inline"
                      style={{ padding: "10px 12px", minHeight: 44 }}
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  className="btn btn-neutral inline"
                  href="/login"
                  style={{ padding: "10px 12px", minHeight: 44 }}
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>

        {/* Page container */}
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 12px 24px" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
