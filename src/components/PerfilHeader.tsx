import { cn } from "@/lib/utils";
import type { Perfil, ConfiguracaoTema } from "@/lib/bloco-types";
import { parseConfiguracaoTema } from "@/lib/bloco-types";
import { Instagram, Linkedin, Github, Youtube, Twitter, ExternalLink } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  youtube: Youtube,
  twitter: Twitter,
};

interface Props {
  perfil: Perfil;
  className?: string;
}

export function PerfilHeader({ perfil, className }: Props) {
  const tema = parseConfiguracaoTema(perfil.configuracao_tema) as ConfiguracaoTema;
  const redes = tema.redes_sociais ?? [];
  const nome = perfil.nome_completo || perfil.slug;

  return (
    <section className={cn("flex flex-col sm:flex-row items-start gap-6 mb-10 sm:mb-12", className)}>
      <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 overflow-hidden ring-2 ring-violet-500/40 shrink-0">
        {perfil.avatar_url ? (
          <img src={perfil.avatar_url} alt={nome} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-3xl font-bold text-white">
            {nome[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{nome}</h1>
        <p className="text-muted-foreground mt-1">@{perfil.slug}</p>
        {perfil.bio && (
          <p className="mt-4 text-foreground/90 leading-relaxed max-w-xl">{perfil.bio}</p>
        )}
        {redes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {redes.map((r) => {
              const Icon = iconMap[r.plataforma.toLowerCase()] ?? ExternalLink;
              return (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="h-10 w-10 rounded-xl bg-slate-900/40 border border-slate-800 grid place-items-center hover:border-violet-500/50 transition-colors"
                >
                  <Icon className="h-4 w-4 text-violet-400" />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

