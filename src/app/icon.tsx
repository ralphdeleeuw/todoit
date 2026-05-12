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
          background: "linear-gradient(135deg, #7c2d12, #1c1917)",
          borderRadius: 100,
          position: "relative",
        }}
      >
        {/* Flame glow ring */}
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(circle, #f97316 0%, #9a3412 60%, transparent 100%)",
            display: "flex",
            top: 56,
            left: 76,
          }}
        />
        {/* Lion */}
        <div style={{ fontSize: 280, lineHeight: 1, zIndex: 1, marginTop: -20, display: "flex" }}>🦁</div>
        {/* Checkmark badge */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            right: 48,
            width: 148,
            height: 148,
            borderRadius: "50%",
            background: "#166534",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 118,
              height: 118,
              borderRadius: "50%",
              background: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 72,
              color: "white",
              fontWeight: "bold",
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
