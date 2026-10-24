import Link from "next/link";
import { PlatformDetailShell } from "@/features/platform/components/platform-detail-shell";
import { LoginFormCard } from "@/features/auth/components/login-form-card";
import { ProblemAlert } from "@/components/api/problem-alert";
import { serverApiFetch } from "@/lib/api/server-api";
import { getServerSession } from "@/lib/auth/session-store";
import type {
  PlanVersion,
  ProductModule,
  SubscriptionOverview,
} from "../schemas/subscription-schemas";
import { CommercialManager } from "./commercial-manager";
export async function CommercialPage({ institutionId }: { institutionId?: string }) {
  const session = await getServerSession();
  if (!session)
    return (
      <LoginFormCard
        title="Administración comercial"
        description="Inicie sesión para gestionar planes y suscripciones."
        returnTo={institutionId ? `/institutions/${institutionId}/subscription` : "/plans"}
        hostLabel="Administración global"
      />
    );
  const [plans, modules, subscription] = await Promise.all([
    serverApiFetch<PlanVersion[]>("/api/platform/plans"),
    serverApiFetch<ProductModule[]>("/api/platform/product-modules"),
    institutionId
      ? serverApiFetch<SubscriptionOverview>(
          `/api/platform/institutions/${institutionId}/subscription`,
        )
      : null,
  ]);
  return (
    <PlatformDetailShell
      name={session.user.name}
      email={session.user.email}
      csrfToken={session.csrfToken}
    >
      <Link
        href={institutionId ? `/institutions/${institutionId}` : "/"}
        className="mb-4 inline-block text-sm underline"
      >
        ← {institutionId ? "Ficha del colegio" : "Colegios"}
      </Link>
      {!plans.ok ? (
        <ProblemAlert problem={plans.problem} />
      ) : !modules.ok ? (
        <ProblemAlert problem={modules.problem} />
      ) : subscription && !subscription.ok ? (
        <ProblemAlert problem={subscription.problem} />
      ) : (
        <CommercialManager
          plans={plans.data}
          modules={modules.data}
          initial={subscription?.ok ? subscription.data : null}
          institutionId={institutionId}
          csrfToken={session.csrfToken}
        />
      )}
    </PlatformDetailShell>
  );
}
