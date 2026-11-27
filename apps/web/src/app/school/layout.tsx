import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveHost } from "@/lib/tenancy/host";
import { schoolFont } from "@/lib/fonts/school-font";

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const incomingHeaders = await headers();
  const rawHost = incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host");
  const resolution = resolveHost(rawHost);

  if (resolution.kind !== "tenant") {
    notFound();
  }

  return <div className={`${schoolFont.variable} school-theme min-h-screen`}>{children}</div>;
}
