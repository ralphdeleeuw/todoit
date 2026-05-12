import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const size = parseInt(new URL(req.url).searchParams.get("size") ?? "512");
  const w = size <= 192 ? 192 : 512;

  const scale = w / 192;
  const r = Math.round(38 * scale);

  return new ImageResponse(
    (
      <div
        style={{
          width: w,
          height: w,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7c2d12, #1c1917)",
          borderRadius: r,
          position: "relative",
        }}
      >
        {/* Flame glow */}
        <div
          style={{
            position: "absolute",
            width: Math.round(310 * scale),
            height: Math.round(310 * scale),
            borderRadius: "50%",
            background:
              "radial-gradient(circle, #f97316 0%, #9a3412 55%, transparent 100%)",
            display: "flex",
            top: Math.round(30 * scale),
            left: Math.round(40 * scale),
          }}
        />
        {/* Lion */}
        <div
          style={{
            fontSize: Math.round(240 * scale),
            lineHeight: 1,
            zIndex: 1,
            marginTop: Math.round(-16 * scale),
            display: "flex",
          }}
        >
          🦁
        </div>
        {/* Checkmark badge */}
        <div
          style={{
            position: "absolute",
            bottom: Math.round(10 * scale),
            right: Math.round(10 * scale),
            width: Math.round(66 * scale),
            height: Math.round(66 * scale),
            borderRadius: "50%",
            background: "#166534",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: Math.round(52 * scale),
              height: Math.round(52 * scale),
              borderRadius: "50%",
              background: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: Math.round(32 * scale),
              color: "white",
              fontWeight: "bold",
            }}
          >
            ✓
          </div>
        </div>
      </div>
    ),
    { width: w, height: w }
  );
}
