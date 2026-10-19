import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveHost } from "@/lib/tenancy/host";

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const incomingHeaders = await headers();
  const rawHost = incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host");
  const resolution = resolveHost(rawHost);

  if (resolution.kind !== "tenant") {
    notFound();
  }

  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
