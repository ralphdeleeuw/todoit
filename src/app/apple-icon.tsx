import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #16a34a, #064e3b)",
          borderRadius: 39,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 26,
            left: 35,
            width: 109,
            height: 109,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 35,
            left: 44,
            width: 91,
            height: 91,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.10)",
            display: "flex",
          }}
        />
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          style={{ position: "absolute", top: 0, left: 0, display: "flex" }}
        >
          <polyline
            points="55,81 77,103 127,54"
            stroke="white"
            strokeWidth={18}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            bottom: 14,
            fontSize: 25,
            fontWeight: 900,
            color: "rgba(255,255,255,0.95)",
            letterSpacing: -1,
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
