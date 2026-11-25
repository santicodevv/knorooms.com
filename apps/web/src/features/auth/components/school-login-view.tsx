import Image from "next/image";
import type { FormEventHandler } from "react";
import { Button } from "@/components/ui/button";
import { SchoolLoginBrand } from "@/features/auth/components/school-login-brand";
import {
  SchoolLoginFields,
  type SchoolLoginFieldsProps,
} from "@/features/auth/components/school-login-fields";
import { SchoolLoginProblem } from "@/features/auth/components/school-login-problem";
import type { ProblemDetails } from "@/lib/api/types";
import styles from "@/features/auth/components/school-login.module.css";

export type SchoolLoginViewProps = SchoolLoginFieldsProps & {
  problem: ProblemDetails | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function SchoolLoginView({ problem, onSubmit, ...fields }: SchoolLoginViewProps) {
  return (
    <main className={styles.root}>
      <SchoolLoginBrand />
      <section className={styles.formPanel} aria-labelledby="school-login-title">
        <div className={styles.formContent}>
          <span className={styles.badge}>
            <Image src="/images/auth/login-dot.svg" width={8} height={8} alt="" unoptimized />
            Acceso seguro
          </span>
          <h1 id="school-login-title" className={styles.title}>
            Bienvenido de nuevo
          </h1>
          <p className={styles.description}>
            <span className={styles.desktopDescription}>
              Ingresa con el correo y la contraseña de tu cuenta institucional.
            </span>
            <span className={styles.mobileDescription}>Ingresa con tu cuenta institucional.</span>
          </p>
          <form className={styles.form} onSubmit={onSubmit} noValidate aria-busy={fields.busy}>
            {problem && <SchoolLoginProblem problem={problem} />}
            <SchoolLoginFields {...fields} />
            <Button type="submit" className={styles.submit} disabled={fields.busy}>
              {fields.busy && (
                <Image
                  src="/images/auth/login-spinner.svg"
                  width={18}
                  height={18}
                  alt=""
                  unoptimized
                />
              )}
              <span>{fields.busy ? "Iniciando sesión…" : "Iniciar sesión"}</span>
            </Button>
          </form>
          <span className="sr-only" role="status" aria-live="polite">
            {fields.busy ? "Iniciando sesión…" : ""}
          </span>
          <p className={styles.accessNote}>
            Tu acceso está vinculado a la institución y los permisos de tu cuenta.
          </p>
        </div>
      </section>
    </main>
  );
}
