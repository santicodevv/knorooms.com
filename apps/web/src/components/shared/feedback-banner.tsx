import { CheckCircle2 } from "lucide-react";
import { ProblemAlert } from "@/components/api/problem-alert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ProblemDetails } from "@/lib/api/types";

interface FeedbackBannerProps {
  successTitle?: string;
  successMessage: string | null;
  problem: ProblemDetails | null;
}

export function FeedbackBanner({
  successTitle = "Operación completada",
  successMessage,
  problem,
}: FeedbackBannerProps) {
  if (!successMessage && !problem) {
    return null;
  }

  return (
    <div className="space-y-4">
      {successMessage ? (
        <Alert variant="info">
          <CheckCircle2 className="size-4" />
          <AlertTitle>{successTitle}</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}
      {problem ? <ProblemAlert problem={problem} /> : null}
    </div>
  );
}
