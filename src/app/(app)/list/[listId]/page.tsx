import { verifyFamily } from "@/lib/dal";
import ListClient from "./ListClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ listId: string }>;
}

export default async function ListPage({ params }: PageProps) {
  await verifyFamily();
  const { listId } = await params;
  return <ListClient listId={listId} />;
}
