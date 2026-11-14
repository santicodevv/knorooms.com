import { AcceptStaffInvitationCard } from "@/features/auth/components/accept-staff-invitation-card";

export const metadata = {
  title: "Aceptar invitación de personal · KNOROOMS",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

export default function AcceptStaffInvitationPage() {
  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      <AcceptStaffInvitationCard />
    </main>
  );
}
