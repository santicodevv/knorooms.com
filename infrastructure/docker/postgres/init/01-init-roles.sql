-- Inicialización de roles de PostgreSQL para KNOROOMS.
-- Regla obligatoria: el rol utilizado por la aplicación en tiempo de ejecución NO debe ser superusuario
-- ni poseer el atributo BYPASSRLS, garantizando que las políticas Row-Level Security (RLS) se evalúen siempre.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'knorooms_app') THEN
        CREATE ROLE knorooms_app
            LOGIN
            PASSWORD 'knorooms_local_dev_app'
            NOSUPERUSER
            NOCREATEDB
            NOCREATEROLE
            NOBYPASSRLS;
    END IF;
END
$$;

GRANT CONNECT ON DATABASE knorooms TO knorooms_app;
GRANT USAGE, CREATE ON SCHEMA public TO knorooms_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO knorooms_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO knorooms_app;
