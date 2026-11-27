import { Eye, EyeOff } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { FormFieldError } from "@/components/shared/form-field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRetainedFieldError } from "@/features/auth/hooks/use-retained-field-error";
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
  const emailError = useRetainedFieldError(errors.email?.message);
  const passwordError = useRetainedFieldError(errors.password?.message);

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
        <div
          className={styles.fieldError}
          id="school-login-email-error"
          data-visible={emailError.visible}
          aria-hidden={!emailError.visible}
        >
          <div className={styles.fieldErrorContent}>
            <FormFieldError message={emailError.message} />
          </div>
        </div>
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
            <Eye className={styles.eyeIcon} size={20} strokeWidth={1.75} aria-hidden="true" />
            <EyeOff className={styles.eyeOffIcon} size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <div
          className={styles.fieldError}
          id="school-login-password-error"
          data-visible={passwordError.visible}
          aria-hidden={!passwordError.visible}
        >
          <div className={styles.fieldErrorContent}>
            <FormFieldError message={passwordError.message} />
          </div>
        </div>
      </div>
    </div>
  );
}
