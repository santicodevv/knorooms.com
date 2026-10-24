# ADR-0007: Componentes propios con Tailwind CSS

Fecha: 22/10/2026. Estado: aceptado por solicitud del propietario.

## Decisión
La interfaz utiliza React, HTML semántico y Tailwind CSS v4. Se retiran la configuración de shadcn, Radix Label/Slot y class-variance-authority. Esta decisión sustituye las referencias anteriores a shadcn como stack obligatorio.

Las primitivas reutilizables permanecen en components/ui, escritas y mantenidas por KNOROOMS: Button, ButtonLink, Input, Label, Badge, Alert, Card y Table. Las variantes son mapas de clases Tailwind tipados. Button renderiza un botón nativo (por defecto type=button); los envíos declaran type=submit. ButtonLink renderiza un enlace Next.js; no se utiliza asChild ni se anidan enlaces dentro de botones.

## Presentación
Azul para acciones y selección, superficies blancas sobre fondo suave, bordes discretos, espaciado consistente y estados de foco visibles. Se rediseñan acceso, shell compartido, directorio, asistente de tres pasos, ficha, módulos y modales. La navegación móvil y los modales utilizan dialog nativo, con cierre Escape y contención de foco. Se respeta prefers-reduced-motion.

## Límites
Los módulos, permisos, BFF, autenticación, aislamiento y contratos de datos se conservan. Lucide proporciona iconos y react-hot-toast notificaciones; no son bibliotecas de estilos. clsx/tailwind-merge únicamente componen clases. No reintroducir shadcn ni generadores de componentes sin una nueva decisión del propietario.

## Verificación
Ejecutar formato, lint, tipos, pruebas y compilación del frontend. Inspeccionar el flujo de instituciones y los modales en escritorio y móvil con una cuenta de prueba aislada.
