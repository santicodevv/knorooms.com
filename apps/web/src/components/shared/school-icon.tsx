import Image from "next/image";

export type SchoolIconName =
  | "refresh"
  | "plus"
  | "search"
  | "down"
  | "chevron"
  | "empty-students"
  | "empty-guardians"
  | "close"
  | "check"
  | "back";
const dimensions: Record<SchoolIconName, number> = {
  refresh: 18,
  plus: 18,
  search: 18,
  down: 16,
  chevron: 18,
  "empty-students": 32,
  "empty-guardians": 32,
  close: 18,
  check: 18,
  back: 16,
};

export function SchoolIcon({ name }: { name: SchoolIconName }) {
  return (
    <Image
      src={`/images/students/${name}.svg`}
      alt=""
      width={dimensions[name]}
      height={dimensions[name]}
      unoptimized
    />
  );
}
