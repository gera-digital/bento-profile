import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { redirectParaMeuPerfil } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Grid3x3, Sparkle, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NoCode Folio — Seu portfólio em bento" },
      { name: "description", content: "Crie uma página de perfil modular em blocos bento. Glassmorphism dark mode." },
      { property: "og:title", content: "NoCode Folio" },
      { property: "og:description", content: "Seu link-in-bio estilo bento, dark e elegante." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      void redirectParaMeuPerfil(navigate, user);
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-violet to-violet-glow grid place-items-center shadow-lg shadow-violet/40">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">NoCode<span className="text-violet-400"> Folio</span></span>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link to="/login">Entrar</Link>
        </Button>
      </header>

      <section className="text-center max-w-3xl mx-auto py-12 sm:py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 border border-violet/30 text-xs text-violet-glow mb-6">
          <Sparkle className="h-3 w-3" /> Glassmorphism · Bento Grid · Dark
        </div>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
          Seu portfólio,<br />
          <span className="bg-gradient-to-r from-violet to-violet-glow bg-clip-text text-transparent">
            estilo bento.
          </span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
          Crie uma página link-in-bio modular com blocos arrastáveis. Links, projetos, redes e mais — tudo em uma grade elegante.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg" className="rounded-full bg-violet hover:bg-violet-glow shadow-xl shadow-violet/30">
            <Link to="/login">Criar conta grátis <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="rounded-full">
            <Link to="/$slug" params={{ slug: "demo" }}>Ver demo</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px] mt-8">
        <Feat icon={Grid3x3} title="Bento Grid" desc="Blocos 1×1, 2×1, 2×2 que se adaptam ao mobile." size="2x2" />
        <Feat icon={Zap} title="Edição rápida" desc="Reordene, adicione e remova com um toque." size="2x1" />
        <Feat icon={Sparkle} title="Glassmorphism" desc="Vidro fosco, glow violeta, dark imersivo." size="2x1" />
      </section>
    </div>
  );
}

function Feat({ icon: Icon, title, desc, size }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; size: "2x2" | "2x1" }) {
  const cls = size === "2x2"
    ? "col-span-1 sm:col-span-2 row-span-2 min-h-[380px]"
    : "col-span-1 sm:col-span-2 row-span-1 min-h-[180px]";
  return (
    <div className={`glass glass-interactive p-6 ${cls} flex flex-col justify-between`}>
      <div className="h-12 w-12 rounded-2xl bg-violet/15 grid place-items-center border border-violet/30">
        <Icon className="h-6 w-6 text-violet-glow" />
      </div>
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      </div>
    </div>
  );
}
