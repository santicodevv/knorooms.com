import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ProblemDetails } from "@/lib/api/types";
import styles from "@/features/auth/components/school-login.module.css";

export function SchoolLoginProblem({ problem }: { problem: ProblemDetails }) {
  return (
    <Alert variant="destructive" className={styles.problem}>
      <AlertTitle className={styles.problemTitle}>No pudimos iniciar sesión</AlertTitle>
      <AlertDescription className={styles.problemDescription}>
        {problem.status === 401
          ? "El correo o la contraseña no son correctos. Revisa tus datos e inténtalo de nuevo."
          : (problem.detail ?? problem.title ?? "Inténtalo de nuevo en unos momentos.")}
      </AlertDescription>
    </Alert>
  );
}
