import { AcceptInvitationCard } from "@/features/auth/components/accept-invitation-card";
export const metadata = {
  title: "Aceptar invitación · KNOROOMS",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function AcceptInvitationPage() {
  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      <AcceptInvitationCard />
    </main>
  );
}
