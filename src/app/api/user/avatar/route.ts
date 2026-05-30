import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/auth-helpers";

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

    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    });

    const blob = await put(`avatars/${user.id}.${ext}`, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    if (existing?.image && existing.image.includes("public.blob.vercel-storage.com")) {
      await del(existing.image).catch(() => null);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { image: blob.url },
    });

    return NextResponse.json({ image: blob.url });
  } catch (e) {
    return apiError(e);
  }
}
