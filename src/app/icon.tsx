import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #16a34a, #064e3b)",
          borderRadius: 110,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 75,
            left: 101,
            width: 310,
            height: 310,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 100,
            left: 126,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.10)",
            display: "flex",
          }}
        />
        <svg
          width="512"
          height="512"
          viewBox="0 0 512 512"
          style={{ position: "absolute", top: 0, left: 0, display: "flex" }}
        >
          <polyline
            points="156,230 220,294 360,154"
            stroke="white"
            strokeWidth={52}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            bottom: 44,
            fontSize: 72,
            fontWeight: 900,
            color: "rgba(255,255,255,0.95)",
            letterSpacing: -2,
            display: "flex",
          }}
        >
          todoit
        </div>
      </div>
    ),
    { ...size }
  );
}
