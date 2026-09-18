"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import {
  WEBSITE_STATUS_LABELS,
  LEAD_PRIORITY_LABELS,
  LEAD_STATUS_LABELS,
  DEFAULT_CATEGORIES,
} from "@/lib/constants";

function fillKeys(map: Record<string, string>) {
  return Object.keys(map);
}

export function LeadFiltersPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [websiteStatus, setWebsiteStatus] = useState(
    searchParams.get("websiteStatus") ?? ""
  );
  const [landingPageStatus, setLandingPageStatus] = useState(
    searchParams.get("landingPageStatus") ?? ""
  );
  const [priority, setPriority] = useState(searchParams.get("priority") ?? "");
  const [leadStatus, setLeadStatus] = useState(
    searchParams.get("leadStatus") ?? ""
  );
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [state, setState] = useState(searchParams.get("state") ?? "");
  const [minFollowers, setMinFollowers] = useState(
    searchParams.get("minFollowers") ?? ""
  );
  const [maxFollowers, setMaxFollowers] = useState(
    searchParams.get("maxFollowers") ?? ""
  );
  const [score, setScore] = useState<[number, number]>([
    Number(searchParams.get("minScore") ?? 0),
    Number(searchParams.get("maxScore") ?? 100),
  ]);
  const [opportunities, setOpportunities] = useState(
    searchParams.get("opportunities") === "1"
  );

  const apply = () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (websiteStatus) params.set("websiteStatus", websiteStatus);
    if (landingPageStatus) params.set("landingPageStatus", landingPageStatus);
    if (priority) params.set("priority", priority);
    if (leadStatus) params.set("leadStatus", leadStatus);
    if (city) params.set("city", city);
    if (state) params.set("state", state);
    if (minFollowers) params.set("minFollowers", minFollowers);
    if (maxFollowers) params.set("maxFollowers", maxFollowers);
    if (score[0] > 0) params.set("minScore", String(score[0]));
    if (score[1] < 100) params.set("maxScore", String(score[1]));
    if (opportunities) params.set("opportunities", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAll = () => {
    router.push(pathname);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="opp">Somente oportunidades</Label>
          <Switch
            id="opp"
            checked={opportunities}
            onCheckedChange={setOpportunities}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Categoria</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            {DEFAULT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Website</Label>
        <Select value={websiteStatus} onValueChange={setWebsiteStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            {fillKeys(WEBSITE_STATUS_LABELS).map((k) => (
              <SelectItem key={k} value={k}>
                {WEBSITE_STATUS_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Landing page</Label>
        <Select value={landingPageStatus} onValueChange={setLandingPageStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            <SelectItem value="HAS_LANDING_PAGE">Com landing page</SelectItem>
            <SelectItem value="NO_LANDING_PAGE">Sem landing page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Prioridade</Label>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            {fillKeys(LEAD_PRIORITY_LABELS).map((k) => (
              <SelectItem key={k} value={k}>
                {LEAD_PRIORITY_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Status do lead</Label>
        <Select value={leadStatus} onValueChange={setLeadStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            {fillKeys(LEAD_STATUS_LABELS).map((k) => (
              <SelectItem key={k} value={k}>
                {LEAD_STATUS_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex: Curitiba"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="Ex: PR"
            maxLength={2}
            className="uppercase"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="minF">Seguidores min</Label>
          <Input
            id="minF"
            type="number"
            value={minFollowers}
            onChange={(e) => setMinFollowers(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="maxF">Seguidores max</Label>
          <Input
            id="maxF"
            type="number"
            value={maxFollowers}
            onChange={(e) => setMaxFollowers(e.target.value)}
            placeholder="50.000"
          />
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <Label>Score da oportunidade</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {score[0]} — {score[1]}
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={score}
          onValueChange={(v) => setScore([v[0] ?? 0, v[1] ?? 100])}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={apply} className="flex-1">
          Aplicar filtros
        </Button>
        <Button variant="outline" onClick={clearAll}>
          Limpar
        </Button>
      </div>
    </div>
  );
}