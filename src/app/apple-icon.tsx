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
          background: "linear-gradient(135deg, #7c2d12, #1c1917)",
          borderRadius: 36,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 126,
            height: 126,
            borderRadius: "50%",
            background: "radial-gradient(circle, #f97316 0%, #9a3412 60%, transparent 100%)",
            display: "flex",
            top: 20,
            left: 27,
          }}
        />
        <div style={{ fontSize: 98, lineHeight: 1, zIndex: 1, marginTop: -8, display: "flex" }}>🦁</div>
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: "#166534",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
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
