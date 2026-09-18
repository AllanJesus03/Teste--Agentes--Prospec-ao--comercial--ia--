import { requireAuth } from "@/lib/auth/session";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { config } from "@/lib/config";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="md:hidden">
          <MobileSidebar user={session.user} mockMode={config.mockMode} />
        </div>
        <div className="hidden md:block">
          <Topbar user={session.user} mockMode={config.mockMode} />
        </div>
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}