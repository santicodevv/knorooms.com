import { AppSidebar, type AppSidebarProps } from "@/components/shell/app-sidebar";

export interface AppShellProps {
  sidebar: AppSidebarProps;
  topbar: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <div className="bg-canvas min-h-dvh">
      <AppSidebar {...sidebar} />

      <div className="md:pl-[222px] xl:pl-[246px]">
        <header className="border-divider sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
          <div className="flex min-h-[65px] items-center gap-3 px-4 pl-16 sm:px-6 sm:pl-16 md:min-h-[82px] md:px-[25px] xl:px-8">
            {topbar}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1510px] px-[15px] py-[22px] text-[13px] md:px-[25px] md:py-[29px] xl:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
