import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://jsxwltvcjkdvatakkbut.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzeHdsdHZjamtkdmF0YWtrYnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTc5NzUsImV4cCI6MjA5NDA3Mzk3NX0.SPTY3Oye8A8QArulllLDZZFrRxSyxqiqeoVFmvpirBY";
const BUCKET = "avatars";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Geen bestand" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Alleen JPEG, PNG, WebP of GIF toegestaan" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Bestand te groot (max 5 MB)" }, { status: 400 });
    }

    const ext = file.type === "image/png" ? "png"
      : file.type === "image/webp" ? "webp"
      : file.type === "image/gif" ? "gif"
      : "jpg";

    const path = `${user.id}.${ext}`;
    const bytes = await file.arrayBuffer();

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: bytes,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("Supabase Storage upload error:", err);
      return NextResponse.json({ error: "Upload mislukt" }, { status: 500 });
    }

    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

    await prisma.user.update({
      where: { id: user.id },
      data: { image: imageUrl },
    });

    return NextResponse.json({ image: imageUrl });
  } catch (e) {
    return apiError(e);
  }
}
