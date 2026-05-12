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
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          borderRadius: 36,
          position: "relative",
        }}
      >
        <div style={{ fontSize: 108, lineHeight: 1, marginTop: -10, display: "flex" }}>🦁</div>
        <div
          style={{
            position: "absolute",
            bottom: 14,
            right: 14,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              color: "white",
            }}
          >
            ✓
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
