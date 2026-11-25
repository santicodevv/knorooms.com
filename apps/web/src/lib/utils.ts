import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "school-page",
        "school-section",
        "school-card",
        "school-body",
        "school-small",
        "school-label",
        "school-button",
      ],
      font: ["school"],
      radius: ["school-control", "school-segment", "school-card", "school-panel"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
