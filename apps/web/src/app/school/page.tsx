import { Suspense } from "react";
import { SchoolHomeContent } from "@/features/school/server/home-page";
import { SchoolHomeLoading } from "@/features/school/components/home/school-home-loading";
export default function Page() {
  return (
    <Suspense fallback={<SchoolHomeLoading />}>
      <SchoolHomeContent />
    </Suspense>
  );
}
