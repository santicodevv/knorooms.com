"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  csrfToken: string;
}

export function LogoutButton({ csrfToken }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken,
          Accept: "application/json",
        },
        credentials: "same-origin",
      });

      if (response.ok) {
        const data = (await response.json()) as { logoutUrl?: string };
        if (data.logoutUrl) {
          window.location.assign(data.logoutUrl);
          return;
        }
      }
      window.location.reload();
    } catch {
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleLogout} disabled={loading}>
      <LogOut className="size-4" />
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </Button>
  );
}
