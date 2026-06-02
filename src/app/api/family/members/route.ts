import { NextResponse } from "next/server";
import { requireFamily, apiError } from "@/lib/auth-helpers";
import { getFamilyMembers } from "@/lib/queries";

export async function GET() {
  try {
    const user = await requireFamily();
    const members = await getFamilyMembers(user.familyId);
    return NextResponse.json(members);
  } catch (e) {
    return apiError(e);
  }
}
