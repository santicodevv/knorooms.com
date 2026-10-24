import { redirect } from "next/navigation";
export default async function LegacySubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/institutions/${encodeURIComponent(id)}?tab=modules`);
}
