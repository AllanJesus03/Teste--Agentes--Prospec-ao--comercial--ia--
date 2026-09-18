"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";

interface TopbarProps {
  user: { name?: string | null; email?: string | null };
  mockMode: boolean;
  onMenuClick?: () => void;
}

export function Topbar({ user, mockMode, onMenuClick }: TopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/leads?query=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <form onSubmit={submitSearch} className="relative flex-1 md:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar nome, Instagram, cidade, telefone…"
          className="pl-9"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        {mockMode ? (
          <span className="hidden rounded-full border bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 sm:inline-block">
            MOCK MODE
          </span>
        ) : (
          <span className="hidden rounded-full border bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 sm:inline-block">
            CONECTADO
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 px-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="truncate text-sm font-medium">{user.name ?? "Usuário"}</div>
              <div className="truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/settings")}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async () => {
                await signOut({ callbackUrl: "/login" });
              }}
              className="text-destructive focus:text-destructive"
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}