import Image from "next/image";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { FormFieldError } from "@/components/shared/form-field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LoginFormValues } from "@/features/auth/schemas/auth-schemas";
import styles from "@/features/auth/components/school-login.module.css";

export interface SchoolLoginFieldsProps {
  register: UseFormRegister<LoginFormValues>;
  errors: FieldErrors<LoginFormValues>;
  busy: boolean;
  passwordVisible: boolean;
  onTogglePassword: () => void;
}

export function SchoolLoginFields({
  register,
  errors,
  busy,
  passwordVisible,
  onTogglePassword,
}: SchoolLoginFieldsProps) {
  return (
    <div className={styles.fields}>
      <div className={styles.field}>
        <Label className={styles.fieldLabel} htmlFor="school-login-email">
          Correo electrónico
        </Label>
        <Input
          {...register("email")}
          id="school-login-email"
          className={styles.input}
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="usuario@colegio.edu.do"
          disabled={busy}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "school-login-email-error" : undefined}
        />
        {errors.email?.message && (
          <div className={styles.fieldError} id="school-login-email-error">
            <FormFieldError message={errors.email.message} />
          </div>
        )}
      </div>
      <div className={styles.field}>
        <Label className={styles.fieldLabel} htmlFor="school-login-password">
          Contraseña
        </Label>
        <div className={styles.passwordControl}>
          <Input
            {...register("password")}
            id="school-login-password"
            className={`${styles.input} ${styles.passwordInput}`}
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Escribe tu contraseña"
            disabled={busy}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "school-login-password-error" : undefined}
          />
          <button
            className={`ui-button ${styles.passwordToggle}`}
            type="button"
            onClick={onTogglePassword}
            disabled={busy}
            aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={passwordVisible}
            aria-controls="school-login-password"
          >
            <Image src="/images/auth/login-eye.svg" width={18} height={12} alt="" unoptimized />
          </button>
        </div>
        {errors.password?.message && (
          <div className={styles.fieldError} id="school-login-password-error">
            <FormFieldError message={errors.password.message} />
          </div>
        )}
      </div>
    </div>
  );
}
