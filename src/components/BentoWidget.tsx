import { cn } from "@/lib/utils";
import type { Widget, WidgetSize } from "@/lib/widget-types";
import {
  Instagram, Linkedin, Github, Youtube, Twitter, Twitch,
  MapPin, Mail, ExternalLink, GripVertical, Trash2, Pencil, ArrowLeft, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sizeClasses: Record<WidgetSize, string> = {
  "1x1": "col-span-1 row-span-1 aspect-square md:aspect-auto md:min-h-[180px]",
  "2x1": "col-span-2 row-span-1 min-h-[180px]",
  "1x2": "col-span-1 row-span-2 min-h-[380px]",
  "2x2": "col-span-2 row-span-2 min-h-[380px]",
};

const socialIcons = {
  instagram: Instagram, linkedin: Linkedin, github: Github,
  youtube: Youtube, twitter: Twitter, twitch: Twitch,
};

const socialColors: Record<string, string> = {
  instagram: "from-pink-500 to-orange-400",
  linkedin: "from-sky-500 to-blue-600",
  github: "from-slate-600 to-slate-800",
  youtube: "from-red-500 to-red-700",
  twitter: "from-sky-400 to-blue-500",
  twitch: "from-purple-500 to-violet-700",
};

interface Props {
  widget: Widget;
  index: number;
  total: number;
  editing: boolean;
  onDelete?: (id: string) => void;
  onMove?: (id: string, dir: -1 | 1) => void;
  profileName?: string;
  profileBio?: string;
  profileAvatar?: string | null;
  profileSkills?: string[];
  profileUsername?: string;
}

export function BentoWidget({
  widget, index, total, editing, onDelete, onMove,
  profileName, profileBio, profileAvatar, profileSkills, profileUsername,
}: Props) {
  const wrapper = cn(
    "glass relative group p-5 sm:p-6 overflow-hidden",
    sizeClasses[widget.size],
    !editing && "glass-interactive cursor-pointer",
    editing && "wiggle",
  );

  const stagger = {
    animation: "var(--animate-stagger)",
    animationDelay: `${index * 70}ms`,
  } as React.CSSProperties;

  const content = renderContent(widget, {
    profileName, profileBio, profileAvatar, profileSkills, profileUsername,
  });

  const Wrap = ({ children }: { children: React.ReactNode }) =>
    widget.content.url && !editing ? (
      <a href={widget.content.url} target="_blank" rel="noreferrer" className={wrapper} style={stagger}>
        {children}
      </a>
    ) : (
      <div className={wrapper} style={stagger}>{children}</div>
    );

  return (
    <Wrap>
      {content}
      {editing && (
        <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-1 z-10">
          <div className="flex gap-1">
            <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full"
              onClick={(e) => { e.preventDefault(); onMove?.(widget.id, -1); }}
              disabled={index === 0}>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full"
              onClick={(e) => { e.preventDefault(); onMove?.(widget.id, 1); }}
              disabled={index === total - 1}>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex gap-1">
            {widget.type !== "profile" && (
              <Button size="icon" variant="destructive" className="h-7 w-7 rounded-full"
                onClick={(e) => { e.preventDefault(); onDelete?.(widget.id); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <div className="h-7 w-7 rounded-full bg-secondary/80 grid place-items-center">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}
    </Wrap>
  );
}

function renderContent(
  w: Widget,
  p: { profileName?: string; profileBio?: string; profileAvatar?: string | null; profileSkills?: string[]; profileUsername?: string }
) {
  switch (w.type) {
    case "profile":
      return (
        <div className="flex flex-col h-full justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gradient-to-br from-violet to-violet-glow overflow-hidden ring-2 ring-violet/40 shrink-0">
              {p.profileAvatar ? (
                <img src={p.profileAvatar} alt={p.profileName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-3xl font-bold text-white">
                  {(p.profileName ?? "U")[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{p.profileName || "Sem nome"}</h1>
              <p className="text-sm text-muted-foreground">@{p.profileUsername}</p>
            </div>
          </div>
          {p.profileBio && (
            <p className="text-sm sm:text-base text-foreground/85 leading-relaxed line-clamp-4">{p.profileBio}</p>
          )}
          {p.profileSkills && p.profileSkills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {p.profileSkills.slice(0, 8).map((s) => (
                <span key={s} className="px-3 py-1 rounded-full text-xs font-medium bg-violet/15 text-violet-glow border border-violet/30">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      );

    case "social": {
      const platform = w.content.platform ?? "instagram";
      const Icon = socialIcons[platform] ?? ExternalLink;
      const gradient = socialColors[platform] ?? "from-violet to-violet-glow";
      return (
        <div className="h-full flex flex-col items-center justify-center gap-3">
          <div className={cn("h-14 w-14 rounded-2xl bg-gradient-to-br grid place-items-center shadow-lg", gradient)}>
            <Icon className="h-7 w-7 text-white" strokeWidth={2.2} />
          </div>
          <span className="text-xs font-medium text-muted-foreground capitalize">{platform}</span>
        </div>
      );
    }

    case "link":
      return (
        <div className="h-full flex flex-col justify-between gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet/15 grid place-items-center border border-violet/30">
            <ExternalLink className="h-5 w-5 text-violet-glow" />
          </div>
          <div>
            <h3 className="font-semibold leading-tight">{w.content.title || "Link"}</h3>
            {w.content.subtitle && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{w.content.subtitle}</p>
            )}
          </div>
        </div>
      );

    case "showcase":
      return (
        <div className="absolute inset-0">
          {w.content.image_url ? (
            <img src={w.content.image_url} alt={w.content.title}
              className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet/40 via-fuchsia-500/20 to-sky-500/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">{w.content.title || "Projeto"}</h3>
            {w.content.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{w.content.subtitle}</p>
            )}
          </div>
        </div>
      );

    case "newsletter":
      return (
        <div className="h-full flex flex-col justify-between gap-4">
          <div>
            <div className="h-10 w-10 rounded-xl bg-violet/15 grid place-items-center border border-violet/30 mb-3">
              <Mail className="h-5 w-5 text-violet-glow" />
            </div>
            <h3 className="text-lg font-bold">{w.content.heading || "Receba novidades"}</h3>
            <p className="text-sm text-muted-foreground mt-1">{w.content.description || "Newsletter semanal sobre design e código."}</p>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <Input type="email" placeholder="seu@email.com"
              className="bg-secondary/60 border-border/60 rounded-xl" />
            <Button type="submit" className="rounded-xl bg-violet hover:bg-violet-glow">Assinar</Button>
          </form>
        </div>
      );

    case "map":
      return (
        <div className="absolute inset-0 overflow-hidden">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full opacity-60">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="oklch(0.4 0.05 265)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#grid)" />
            <path d="M 0 120 Q 50 80 100 100 T 200 90" stroke="oklch(0.6 0.15 290)" strokeWidth="2" fill="none" />
            <path d="M 0 70 Q 80 60 130 90 T 200 140" stroke="oklch(0.5 0.15 240)" strokeWidth="1.5" fill="none" />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative">
              <div className="absolute inset-0 -m-2 rounded-full bg-violet/30 blur-md animate-pulse" />
              <div className="relative h-10 w-10 rounded-full bg-violet grid place-items-center ring-4 ring-violet/30">
                <MapPin className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-950/90 to-transparent">
            <p className="text-sm font-semibold">{w.content.location || "Localização"}</p>
          </div>
        </div>
      );

    case "note":
      return (
        <div className="h-full flex items-center">
          <p className="text-base sm:text-lg font-medium leading-snug">
            {w.content.text || "Adicione uma nota."}
          </p>
        </div>
      );
  }
}
