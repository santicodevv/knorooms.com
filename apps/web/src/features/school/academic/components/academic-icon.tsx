import Image from "next/image";
const dimensions = {
  "empty-subjects": 32,
  "empty-teachers": 32,
  calendar: 18,
  "select-down": 18,
  "plus-dark": 18,
  "plus-dark-small": 16,
} as const;
export function AcademicIcon({ name }: { name: keyof typeof dimensions }) {
  return (
    <Image
      src={`/images/academic/${name}.svg`}
      width={dimensions[name]}
      height={dimensions[name]}
      alt=""
      unoptimized
    />
  );
}
