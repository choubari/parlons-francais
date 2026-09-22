"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#FBF6EF",
          color: "#241C14",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>Something went wrong.</h2>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 12,
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #EDE3D6",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
