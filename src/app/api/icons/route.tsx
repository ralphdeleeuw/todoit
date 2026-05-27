import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const size = parseInt(new URL(req.url).searchParams.get("size") ?? "512");
  const w = size <= 192 ? 192 : 512;
  const s = w / 512;

  return new ImageResponse(
    (
      <div
        style={{
          width: w,
          height: w,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #16a34a, #064e3b)",
          borderRadius: Math.round(110 * s),
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: Math.round(75 * s),
            left: Math.round(101 * s),
            width: Math.round(310 * s),
            height: Math.round(310 * s),
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: Math.round(100 * s),
            left: Math.round(126 * s),
            width: Math.round(260 * s),
            height: Math.round(260 * s),
            borderRadius: "50%",
            background: "rgba(255,255,255,0.10)",
            display: "flex",
          }}
        />
        <svg
          width={w}
          height={w}
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
            bottom: Math.round(44 * s),
            fontSize: Math.round(72 * s),
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
    { width: w, height: w }
  );
}
