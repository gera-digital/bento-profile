import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { usePerfilPorSlug, useAtualizarPerfil } from "@/hooks/use-perfil";
import {
  useBlocos,
  useCriarBloco,
  useAtualizarBloco,
  useExcluirBloco,
  useReordenarBlocos,
} from "@/hooks/use-blocos";
import type { Bloco, Perfil } from "@/lib/bloco-types";
import { uploadAvatar } from "@/lib/storage-upload";
import { PerfilHeader } from "./PerfilHeader";
import { BlocoGrid } from "./BlocoGrid";
import { BlocoFormDialog, type BlocoFormValues } from "./BlocoFormDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, Plus, LogOut, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface Props {
  slug: string;
}

export function ProfilePage({ slug }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editPerfilOpen, setEditPerfilOpen] = useState(false);
  const [blocoFormOpen, setBlocoFormOpen] = useState(false);
  const [blocoEditando, setBlocoEditando] = useState<Bloco | null>(null);

  const { data: perfil, isLoading, isError } = usePerfilPorSlug(slug);
  const incluirOcultos = !!user && !!perfil && user.id === perfil.usuario_id && editing;
  const { data: blocos = [] } = useBlocos(perfil?.id, incluirOcultos);

  const isOwner = !!user && !!perfil && user.id === perfil.usuario_id;

  const criarBloco = useCriarBloco(perfil?.id ?? 0);
  const atualizarBloco = useAtualizarBloco(perfil?.id ?? 0);
  const excluirBloco = useExcluirBloco(perfil?.id ?? 0);
  const reordenar = useReordenarBlocos(perfil?.id ?? 0);

  const logout = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const handleDelete = (id: number) => {
    excluirBloco.mutate(id, {
      onSuccess: () => toast.success("Bloco removido"),
      onError: (e) => toast.error(e.message),
    });
  };

  const handleMove = (id: number, dir: -1 | 1) => {
    const idx = blocos.findIndex((b) => b.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= blocos.length) return;
    const next = [...blocos];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    reordenar.mutate(next);
  };

  const handleBlocoSubmit = (values: BlocoFormValues) => {
    if (!perfil) return;
    if (blocoEditando) {
      atualizarBloco.mutate(
        {
          id: blocoEditando.id,
          tipo: values.tipo,
          titulo: values.titulo || null,
          conteudo: values.conteudo,
          colunas: values.colunas,
          linhas: values.linhas,
        },
        {
          onSuccess: () => {
            toast.success("Bloco atualizado");
            setBlocoFormOpen(false);
            setBlocoEditando(null);
          },
          onError: (e) => toast.error(e.message),
        },
      );
    } else {
      criarBloco.mutate(
        {
          tipo: values.tipo,
          titulo: values.titulo || undefined,
          conteudo: values.conteudo,
          colunas: values.colunas,
          linhas: values.linhas,
          ordem: blocos.length,
        },
        {
          onSuccess: () => {
            toast.success("Bloco adicionado");
            setBlocoFormOpen(false);
          },
          onError: (e) => toast.error(e.message),
        },
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground animate-pulse">Carregando…</div>
      </div>
    );
  }

  if (isError || !perfil) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold">Perfil não encontrado</h1>
          <p className="text-muted-foreground mt-2">O slug @{slug} não existe.</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">Voltar</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 grid place-items-center shadow-lg shadow-violet-500/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">
            NoCode<span className="text-violet-400"> Folio</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <Button variant="ghost" size="sm" onClick={logout} className="rounded-full">
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/login">Criar meu perfil</Link>
            </Button>
          )}
        </div>
      </header>

      <PerfilHeader perfil={perfil} />

      <BlocoGrid
        blocos={blocos}
        perfilId={perfil.id}
        editing={editing && isOwner}
        onDelete={handleDelete}
        onMove={handleMove}
        onEdit={(b) => {
          setBlocoEditando(b);
          setBlocoFormOpen(true);
        }}
        onReorder={(ordenados) => reordenar.mutate(ordenados)}
        addSlot={
          editing && isOwner ? (
            <button
              type="button"
              onClick={() => {
                setBlocoEditando(null);
                setBlocoFormOpen(true);
              }}
              className="col-span-1 row-span-1 min-h-[180px] rounded-3xl border border-dashed border-slate-700 bg-slate-900/20 grid place-items-center hover:border-violet-500/50 transition-colors"
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="h-12 w-12 rounded-2xl bg-violet-500/15 grid place-items-center border border-violet-500/30">
                  <Plus className="h-6 w-6 text-violet-400" />
                </div>
                <span className="text-sm font-medium">Adicionar bloco</span>
              </div>
            </button>
          ) : undefined
        }
      />

      <footer className="mt-16 text-center text-xs text-muted-foreground">
        Feito com <span className="text-violet-400">♥</span> no NoCode Folio
      </footer>

      {isOwner && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {editing && (
            <Dialog open={editPerfilOpen} onOpenChange={setEditPerfilOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="secondary" className="rounded-full shadow-xl">
                  <Pencil className="h-4 w-4 mr-2" /> Perfil
                </Button>
              </DialogTrigger>
              <EditPerfilDialog
                perfil={perfil}
                usuarioId={user!.id}
                onSaved={() => setEditPerfilOpen(false)}
              />
            </Dialog>
          )}
          <Button
            size="lg"
            onClick={() => setEditing((e) => !e)}
            className="rounded-full shadow-xl shadow-violet-500/40 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90"
          >
            {editing ? (
              <>
                <Check className="h-4 w-4 mr-2" /> Concluir
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2" /> Editar Grid
              </>
            )}
          </Button>
        </div>
      )}

      <BlocoFormDialog
        open={blocoFormOpen}
        onOpenChange={(o) => {
          setBlocoFormOpen(o);
          if (!o) setBlocoEditando(null);
        }}
        bloco={blocoEditando}
        usuarioId={user!.id}
        onSubmit={handleBlocoSubmit}
        loading={criarBloco.isPending || atualizarBloco.isPending}
      />
    </div>
  );
}

function EditPerfilDialog({
  perfil,
  usuarioId,
  onSaved,
}: {
  perfil: Perfil;
  usuarioId: string;
  onSaved: () => void;
}) {
  const atualizar = useAtualizarPerfil();
  const [form, setForm] = useState({
    nome_completo: perfil.nome_completo ?? "",
    bio: perfil.bio ?? "",
    slug: perfil.slug,
    redes: JSON.stringify(
      (perfil.configuracao_tema as { redes_sociais?: unknown })?.redes_sociais ?? [],
      null,
      2,
    ),
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const save = async () => {
    const slugNorm = form.slug.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!slugNorm) {
      toast.error("Slug inválido");
      return;
    }
    let configuracao_tema: Json = perfil.configuracao_tema;
    try {
      const redes = JSON.parse(form.redes);
      configuracao_tema = { redes_sociais: redes } as Json;
    } catch {
      toast.error("JSON de redes sociais inválido");
      return;
    }
    let avatar_url = perfil.avatar_url;
    if (avatarFile) {
      try {
        avatar_url = await uploadAvatar(usuarioId, avatarFile);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro no upload");
        return;
      }
    }
    atualizar.mutate(
      {
        id: perfil.id,
        slug: slugNorm,
        updates: {
          nome_completo: form.nome_completo,
          bio: form.bio,
          slug: slugNorm,
          avatar_url,
          configuracao_tema,
        },
      },
      {
        onSuccess: (data) => {
          toast.success("Perfil atualizado");
          onSaved();
          if (data.slug !== perfil.slug) {
            window.location.href = `/${data.slug}`;
          }
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Editar perfil</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Nome</Label>
          <Input
            value={form.nome_completo}
            onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
          />
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
        </div>
        <div>
          <Label>Slug da URL</Label>
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <p className="text-xs text-muted-foreground mt-1">folio.io/{form.slug || "seu-slug"}</p>
        </div>
        <div>
          <Label>Avatar</Label>
          <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <Label>Redes sociais (JSON)</Label>
          <Textarea
            value={form.redes}
            onChange={(e) => setForm({ ...form, redes: e.target.value })}
            rows={4}
            placeholder='[{"plataforma":"instagram","url":"https://..."}]'
          />
        </div>
        <Button
          onClick={() => void save()}
          disabled={atualizar.isPending}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600"
        >
          Salvar
        </Button>
      </div>
    </DialogContent>
  );
}

