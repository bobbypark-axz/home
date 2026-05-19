import { notFound } from "next/navigation";
import { LH_LISTINGS } from "@/lib/lh-adapter";
import { DetailPageClient } from "./DetailPageClient";

export default async function ListingDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = LH_LISTINGS.find((x) => x.id === id);
  if (!item) notFound();
  return <DetailPageClient item={item} />;
}
