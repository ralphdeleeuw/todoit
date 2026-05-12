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
          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
          borderRadius: 100,
          position: "relative",
        }}
      >
        {/* Lion emoji */}
        <div style={{ fontSize: 300, lineHeight: 1, marginTop: -30, display: "flex" }}>🦁</div>

        {/* Checkmark badge */}
        <div
          style={{
            position: "absolute",
            bottom: 52,
            right: 52,
            width: 152,
            height: 152,
            borderRadius: "50%",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: "50%",
              background: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 80,
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
