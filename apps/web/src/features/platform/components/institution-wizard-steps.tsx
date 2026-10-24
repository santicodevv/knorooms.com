import { Check } from "lucide-react";
const steps = [
  { title: "Datos generales", description: "Información principal del colegio" },
  { title: "Módulos", description: "Selecciona las funcionalidades" },
  { title: "Confirmación", description: "Revisa antes de crear" },
];
export function InstitutionWizardSteps({
  step,
  onStep,
}: {
  step: number;
  onStep: (value: number) => void;
}) {
  return (
    <aside
      aria-label="Progreso de creación"
      className="border-divider flex gap-1 rounded-[13px] border bg-white p-3 md:sticky md:top-28 md:flex-col md:p-[18px]"
    >
      {steps.map((item, index) => (
        <button
          key={item.title}
          type="button"
          disabled={index > step}
          aria-current={index === step ? "step" : undefined}
          onClick={() => onStep(index)}
          className={`flex flex-1 items-center gap-2 rounded-[9px] p-2 text-left md:items-start md:gap-3 md:p-3 ${index === step ? "bg-[#edf4ff]" : ""}`}
        >
          <span
            className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${index <= step ? "border-blue-600 bg-blue-600 text-white" : "text-muted border-slate-200 bg-white"}`}
          >
            {index < step ? <Check className="size-3" /> : index + 1}
          </span>
          <span>
            <span
              className={`block text-[11px] font-semibold md:text-xs ${index === step ? "text-blue-600" : "text-slate-600"}`}
            >
              {item.title}
            </span>
            <span className="text-muted mt-1 hidden text-[11px] leading-5 md:block">
              {item.description}
            </span>
          </span>
        </button>
      ))}
    </aside>
  );
}
