"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  MessageSquare,
  KanbanSquare,
  BarChart3,
  ScrollText,
  Settings,
  X,
  Flame,
  Menu as MenuIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/campaigns", label: "Campanhas", icon: Megaphone },
  { href: "/messages", label: "Mensagens", icon: MessageSquare },
  { href: "/pipeline", label: "Pipeline CRM", icon: KanbanSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/logs", label: "Logs", icon: ScrollText },
  { href: "/settings", label: "Configurações", icon: Settings },
];

interface MobileSidebarProps {
  user: { name?: string | null; email?: string | null };
  mockMode: boolean;
}

export function MobileSidebar({ user, mockMode }: MobileSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Flame className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold">LeadScout</span>
        {mockMode ? (
          <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            MOCK MODE
          </span>
        ) : null}
      </div>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow md:hidden"
          aria-label="Abrir menu"
        >
          <MenuGlyph />
        </button>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex w-64 flex-col bg-sidebar shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">LeadScout</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t p-3">
              <p className="mb-1 truncate text-xs font-medium">{user.name ?? "Usuário"}</p>
              <p className="mb-3 truncate text-[11px] text-muted-foreground">{user.email}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MenuGlyph() {
  return <MenuIcon />;
}