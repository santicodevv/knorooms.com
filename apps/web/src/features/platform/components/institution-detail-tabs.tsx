const tabs = [
  ["summary", "Resumen"],
  ["information", "Información"],
  ["modules", "Módulos"],
  ["administrator", "Administrador"],
];
export function InstitutionDetailTabs({
  tab,
  onChange,
}: {
  tab: string;
  onChange: (value: string) => void;
}) {
  return (
    <nav
      aria-label="Secciones de la institución"
      className="border-divider flex gap-5 overflow-x-auto border-y px-5 sm:px-[23px]"
    >
      {tabs.map(([key, label]) => (
        <button
          key={key}
          aria-current={tab === key ? "page" : undefined}
          onClick={() => onChange(key)}
          className={`shrink-0 border-b-2 px-1 py-4 text-xs font-semibold ${tab === key ? "border-blue-600 text-blue-600" : "text-muted border-transparent hover:text-slate-700"}`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
