import Image from "next/image";
import styles from "@/features/auth/components/school-login.module.css";

export function SchoolLoginBrand() {
  return (
    <section className={styles.brand} aria-label="KNOROOMS">
      <div className={styles.logo}>
        <span className={styles.mark} aria-hidden="true">
          K
        </span>
        <span>KNOROOMS</span>
      </div>
      <div className={styles.message}>
        <Image
          className={styles.desktopIllustration}
          src="/images/auth/login-illustration-desktop.svg"
          width={560}
          height={360}
          alt=""
          unoptimized
          loading="eager"
        />
        <div className={styles.mobileIllustration}>
          <Image
            className={styles.mobileImage}
            src="/images/auth/login-illustration-mobile.svg"
            width={300}
            height={193}
            alt=""
            unoptimized
            loading="eager"
          />
        </div>
        <h2 className={styles.brandTitle}>Más claridad para gestionar la educación.</h2>
        <p className={styles.brandDescription}>
          Conecta instituciones, personas y herramientas en un espacio pensado para tu comunidad
          educativa.
        </p>
      </div>
      <p className={styles.brandFooter}>Gestión educativa · República Dominicana</p>
    </section>
  );
}
