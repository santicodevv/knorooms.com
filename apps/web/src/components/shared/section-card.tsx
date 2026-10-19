import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SectionCardProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function SectionCard({
  icon,
  title,
  description,
  headerAction,
  children,
  footer,
  className,
}: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader
        className={
          headerAction
            ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            : undefined
        }
      >
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle>{title}</CardTitle>
          </div>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
        {headerAction}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}
