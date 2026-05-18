import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Bloco } from "@/lib/bloco-types";
import {
  colSpanClass,
  parseConteudo,
  rowSpanClass,
  type ConteudoImagem,
  type ConteudoLink,
  type ConteudoMapa,
  type ConteudoNewsletter,
  type ConteudoTexto,
  type ConteudoVideo,
} from "@/lib/bloco-types";
import { useCriarLead } from "@/hooks/use-leads";
import {
  Copy,
  ExternalLink,
  GripVertical,
  MapPin,
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Props {
  bloco: Bloco;
  perfilId: number;
  index: number;
  total: number;
  editing: boolean;
  onDelete?: (id: number) => void;
  onMove?: (id: number, dir: -1 | 1) => void;
  onEdit?: (bloco: Bloco) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function BlocoCard({
  bloco,
  perfilId,
  index,
  total,
  editing,
  onDelete,
  onMove,
  onEdit,
  dragHandleProps,
}: Props) {
  const wrapper = cn(
    "glass relative group p-5 sm:p-6 overflow-hidden rounded-3xl",
    "bg-slate-900/40 backdrop-blur-md border border-slate-800",
    "hover:border-violet-500/50 transition-colors",
    colSpanClass(bloco.colunas),
    rowSpanClass(bloco.linhas),
    !editing && "glass-interactive",
    editing && "wiggle",
  );

  const stagger = {
    animation: "var(--animate-stagger)",
    animationDelay: `${index * 70}ms`,
  } as React.CSSProperties;

  const tipo = bloco.tipo;
  const linkContent = parseConteudo<ConteudoLink>(bloco.conteudo);
  const isExternalLink = !editing && tipo === "link" && !!linkContent.url;

  const toolbar = editing ? (
    <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-1 z-10">
      <div className="flex gap-1">
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7 rounded-full"
          onClick={(e) => {
            e.preventDefault();
            onMove?.(bloco.id, -1);
          }}
          disabled={index === 0}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7 rounded-full"
          onClick={(e) => {
            e.preventDefault();
            onMove?.(bloco.id, 1);
          }}
          disabled={index === total - 1}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex gap-1">
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7 rounded-full"
          onClick={(e) => {
            e.preventDefault();
            onEdit?.(bloco);
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-7 w-7 rounded-full"
          onClick={(e) => {
            e.preventDefault();
            onDelete?.(bloco.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <button
          type="button"
          className="h-7 w-7 rounded-full bg-secondary/80 grid place-items-center cursor-grab active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  ) : null;

  const inner = (
    <>
      <BlocoInner bloco={bloco} perfilId={perfilId} editing={editing} />
      {toolbar}
    </>
  );

  if (isExternalLink && linkContent.url) {
    return (
      <a href={linkContent.url} target="_blank" rel="noreferrer" className={wrapper} style={stagger}>
        {inner}
      </a>
    );
  }

  return (
    <div className={wrapper} style={stagger}>
      {inner}
    </div>
  );
}

function BlocoInner({ bloco, perfilId, editing }: { bloco: Bloco; perfilId: number; editing: boolean }) {
  const tipo = bloco.tipo;

  switch (tipo) {
    case "link": {
      const c = parseConteudo<ConteudoLink>(bloco.conteudo);
      if (!c.url && !c.rotulo && !bloco.titulo) return <EmptyBloco label="Link" />;
      return (
        <div className="h-full flex flex-col justify-between gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet/15 grid place-items-center border border-violet/30">
            <ExternalLink className="h-5 w-5 text-violet-glow" />
          </div>
          <div>
            <h3 className="font-semibold leading-tight">{bloco.titulo || c.rotulo || "Link"}</h3>
            {c.url && <p className="text-xs text-muted-foreground mt-1 truncate">{c.url}</p>}
          </div>
        </div>
      );
    }
    case "imagem": {
      const c = parseConteudo<ConteudoImagem>(bloco.conteudo);
      if (!c.url) return <EmptyBloco label="Imagem" />;
      return (
        <div className="absolute inset-0">
          <img src={c.url} alt={c.legenda || bloco.titulo || ""} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          {(bloco.titulo || c.legenda) && (
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="font-semibold">{bloco.titulo || c.legenda}</p>
            </div>
          )}
        </div>
      );
    }
    case "texto": {
      const c = parseConteudo<ConteudoTexto>(bloco.conteudo);
      if (!c.texto) return <EmptyBloco label="Texto" />;
      return <TextoBloco bloco={bloco} conteudo={c} editing={editing} />;
    }
    case "mapa": {
      const c = parseConteudo<ConteudoMapa>(bloco.conteudo);
      const mapsUrl =
        c.lat != null && c.lng != null
          ? `https://www.google.com/maps?q=${c.lat},${c.lng}`
          : c.endereco
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.endereco)}`
            : undefined;
      const body = (
        <div className="h-full flex flex-col justify-end gap-2">
          <MapPin className="h-8 w-8 text-violet-glow" />
          <p className="font-semibold">{c.endereco || bloco.titulo || "Localização"}</p>
          {c.lat != null && c.lng != null && (
            <p className="text-xs text-muted-foreground">
              {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
            </p>
          )}
        </div>
      );
      if (!editing && mapsUrl) {
        return (
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="block h-full">
            {body}
          </a>
        );
      }
      return body;
    }
    case "video": {
      const c = parseConteudo<ConteudoVideo>(bloco.conteudo);
      const embed = youtubeEmbed(c.url);
      if (!embed) return <EmptyBloco label="YouTube" />;
      if (editing) {
        return (
          <div className="h-full flex flex-col justify-center gap-2">
            <p className="font-semibold">{bloco.titulo || "Vídeo"}</p>
            <p className="text-xs text-muted-foreground truncate">{c.url}</p>
          </div>
        );
      }
      return (
        <div className="absolute inset-0">
          <iframe
            src={embed}
            title={bloco.titulo || "Vídeo"}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    case "newsletter": {
      const c = parseConteudo<ConteudoNewsletter>(bloco.conteudo);
      return <NewsletterBloco bloco={bloco} conteudo={c} perfilId={perfilId} editing={editing} />;
    }
    default:
      return <EmptyBloco label={tipo} />;
  }
}

function TextoBloco({
  bloco,
  conteudo,
  editing,
}: {
  bloco: Bloco;
  conteudo: ConteudoTexto;
  editing: boolean;
}) {
  const copiar = async () => {
    if (!conteudo.texto) return;
    await navigator.clipboard.writeText(conteudo.texto);
    toast.success("Copiado para a área de transferência");
  };

  return (
    <div className="h-full flex flex-col justify-between gap-4">
      <div>
        {bloco.titulo && <p className="text-sm text-muted-foreground mb-2">{bloco.titulo}</p>}
        <p className="text-lg font-medium break-all">{conteudo.texto}</p>
      </div>
      {conteudo.tipo_copia && !editing && (
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void copiar();
          }}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 w-fit"
        >
          <Copy className="h-4 w-4 mr-2" /> Copiar
        </Button>
      )}
    </div>
  );
}

function NewsletterBloco({
  bloco,
  conteudo,
  perfilId,
  editing,
}: {
  bloco: Bloco;
  conteudo: ConteudoNewsletter;
  perfilId: number;
  editing: boolean;
}) {
  const [email, setEmail] = useState("");
  const criarLead = useCriarLead(perfilId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await criarLead.mutateAsync(email.trim());
      toast.success("Inscrição realizada!");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao inscrever");
    }
  };

  return (
    <div className="h-full flex flex-col justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold">{conteudo.titulo || bloco.titulo || "Newsletter"}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {conteudo.descricao || "Receba novidades por email."}
        </p>
      </div>
      {!editing && (
        <form onSubmit={submit} className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Input
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-secondary/60 border-border/60 rounded-xl"
          />
          <Button
            type="submit"
            disabled={criarLead.isPending}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 shrink-0"
          >
            Assinar
          </Button>
        </form>
      )}
    </div>
  );
}

function EmptyBloco({ label }: { label: string }) {
  return <p className="text-muted-foreground text-sm">Configure o bloco {label}</p>;
}

function youtubeEmbed(url?: string): string | null {
  if (!url) return null;
  const match =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/) ??
    url.match(/^([\w-]{11})$/);
  const id = match?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
