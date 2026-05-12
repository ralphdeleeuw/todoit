"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          background: "#0f172a",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          flexDirection: "column",
          gap: "16px",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <p style={{ fontSize: "1.1rem" }}>Er is iets mis gegaan.</p>
        <button
          onClick={unstable_retry}
          style={{
            padding: "10px 24px",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Opnieuw proberen
        </button>
      </body>
    </html>
  );
}
