import { headers } from "next/headers";
import { SchoolShell } from "@/components/school/school-shell";
import { getSchoolContext } from "@/features/school/server/school-context";
import { sanitizeReturnTo } from "@/lib/auth/return-to";

export default async function SchoolPortalLayout({ children }: { children: React.ReactNode }) {
  const data = await getSchoolContext();
  const incoming = await headers();
  const returnTo = sanitizeReturnTo(incoming.get("x-knorooms-pathname"));

  return (
    <SchoolShell {...data} returnTo={returnTo} hideCommercialStatus>
      {children}
    </SchoolShell>
  );
}
