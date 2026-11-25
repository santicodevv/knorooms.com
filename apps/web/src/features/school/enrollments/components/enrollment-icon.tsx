import Image from "next/image";
export function EnrollmentIcon({ name }: { name: "search" | "down" | "calendar" }) {
  const size = name === "search" ? 16 : 18;
  return (
    <Image src={`/images/enrollments/${name}.svg`} alt="" width={size} height={size} unoptimized />
  );
}
