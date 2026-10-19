import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RefreshButtonProps {
  onClick: () => void;
  loading: boolean;
  label?: string;
}

export function RefreshButton({ onClick, loading, label = "Actualizar" }: RefreshButtonProps) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={loading}>
      <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
      {label}
    </Button>
  );
}
