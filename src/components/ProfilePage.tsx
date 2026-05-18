import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Profile, Widget, WidgetType, WidgetSize } from "@/lib/widget-types";
import { BentoWidget } from "./BentoWidget";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pencil, Check, Plus, LogOut, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Props { username: string }

export function ProfilePage({ username }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const isOwner = !!user && !!profile && user.id === profile.id;

  const load = useCallback(async () => {
    setLoading(true);
    const { data: p } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
    if (!p) { setProfile(null); setLoading(false); return; }
    setProfile(p as Profile);
    const { data: w } = await supabase.from("widgets").select("*")
      .eq("profile_id", p.id).order("position_index", { ascending: true });
    setWidgets((w as Widget[]) ?? []);
    setLoading(false);
  }, [username]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    setWidgets((ws) => ws.filter((w) => w.id !== id));
    await supabase.from("widgets").delete().eq("id", id);
    toast.success("Bloco removido");
  };

  const handleMove = async (id: string, dir: -1 | 1) => {
    const idx = widgets.findIndex((w) => w.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= widgets.length) return;
    const next = [...widgets];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const reindexed = next.map((w, i) => ({ ...w, position_index: i }));
    setWidgets(reindexed);
    await Promise.all(
      reindexed.map((w) => supabase.from("widgets").update({ position_index: w.position_index }).eq("id", w.id))
    );
  };

  const addWidget = async (type: WidgetType, size: WidgetSize, content: Record<string, string>) => {
    if (!profile) return;
    const { data, error } = await supabase.from("widgets").insert({
      profile_id: profile.id, type, size, content: content as never, position_index: widgets.length,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setWidgets((ws) => [...ws, data as unknown as Widget]);
    toast.success("Bloco adicionado");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-muted-foreground animate-pulse">Carregando…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold">Perfil não encontrado</h1>
          <p className="text-muted-foreground mt-2">O usuário @{username} não existe.</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">Voltar</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12 max-w-6xl mx-auto">
      {/* top bar */}
      <header className="flex items-center justify-between mb-8 sm:mb-12">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-violet to-violet-glow grid place-items-center shadow-lg shadow-violet/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">NewPort<span className="text-violet-glow">.Folio</span></span>
        </Link>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <>
              <Button variant="ghost" size="sm" onClick={logout} className="rounded-full">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/login">Criar meu perfil</Link>
            </Button>
          )}
        </div>
      </header>

      {/* bento grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px]">
        {/* virtual profile card */}
        <BentoWidget
          widget={{
            id: "__profile",
            profile_id: profile.id,
            type: "profile",
            size: "2x2",
            position_index: -1,
            content: {},
          }}
          index={0}
          total={widgets.length + 1}
          editing={editing}
          profileName={profile.full_name ?? profile.username}
          profileBio={profile.bio ?? undefined}
          profileAvatar={profile.avatar_url}
          profileSkills={profile.skills ?? undefined}
          profileUsername={profile.username}
          onDelete={() => setEditProfileOpen(true)}
          onMove={() => {}}
        />
        {widgets.map((w, i) => (
          <BentoWidget
            key={w.id}
            widget={w}
            index={i}
            total={widgets.length}
            editing={editing && isOwner}
            onDelete={handleDelete}
            onMove={handleMove}
            profileName={profile.full_name ?? profile.username}
          />
        ))}

        {editing && isOwner && (
          <AddWidgetCard onAdd={addWidget} />
        )}
      </div>

      {/* footer */}
      <footer className="mt-16 text-center text-xs text-muted-foreground">
        Feito com <span className="text-violet-glow">♥</span> no NewPort Folio
      </footer>

      {/* floating edit button */}
      {isOwner && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {editing && (
            <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="secondary" className="rounded-full shadow-xl">
                  <Pencil className="h-4 w-4 mr-2" /> Perfil
                </Button>
              </DialogTrigger>
              <EditProfileDialog profile={profile} onSaved={(p) => { setProfile(p); load(); }} />
            </Dialog>
          )}
          <Button
            size="lg"
            onClick={() => setEditing((e) => !e)}
            className="rounded-full shadow-xl shadow-violet/40 bg-violet hover:bg-violet-glow"
          >
            {editing ? <><Check className="h-4 w-4 mr-2" /> Concluir</> : <><Pencil className="h-4 w-4 mr-2" /> Editar Perfil</>}
          </Button>
        </div>
      )}
    </div>
  );
}

/* -------- Add Widget card -------- */

function AddWidgetCard({ onAdd }: { onAdd: (type: WidgetType, size: WidgetSize, content: Record<string, string>) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<WidgetType>("social");
  const [size, setSize] = useState<WidgetSize>("1x1");
  const [form, setForm] = useState<Record<string, string>>({});

  const submit = () => {
    onAdd(type, size, { ...form });
    setOpen(false);
    setForm({});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="glass glass-interactive col-span-1 row-span-1 min-h-[180px] grid place-items-center border-dashed">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="h-12 w-12 rounded-2xl bg-violet/15 grid place-items-center border border-violet/30">
              <Plus className="h-6 w-6 text-violet-glow" />
            </div>
            <span className="text-sm font-medium">Adicionar bloco</span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Novo bloco</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as WidgetType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="social">Rede social</SelectItem>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="showcase">Showcase (imagem)</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="map">Mapa / Localização</SelectItem>
                <SelectItem value="note">Nota</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tamanho</Label>
            <Select value={size} onValueChange={(v) => setSize(v as WidgetSize)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1x1">Pequeno (1×1)</SelectItem>
                <SelectItem value="2x1">Largo (2×1)</SelectItem>
                <SelectItem value="1x2">Alto (1×2)</SelectItem>
                <SelectItem value="2x2">Grande (2×2)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "social" && (
            <>
              <div>
                <Label>Plataforma</Label>
                <Select value={form.platform ?? "instagram"} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["instagram", "linkedin", "github", "youtube", "twitter", "twitch"].map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>URL</Label><Input value={form.url ?? ""} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
            </>
          )}
          {(type === "link" || type === "showcase") && (
            <>
              <div><Label>Título</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Subtítulo</Label><Input value={form.subtitle ?? ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
              <div><Label>URL</Label><Input value={form.url ?? ""} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
              {type === "showcase" && (
                <div><Label>URL da imagem de capa</Label><Input value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
              )}
            </>
          )}
          {type === "newsletter" && (
            <>
              <div><Label>Título</Label><Input value={form.heading ?? ""} onChange={(e) => setForm({ ...form, heading: e.target.value })} /></div>
              <div><Label>Descrição</Label><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </>
          )}
          {type === "map" && (
            <div><Label>Localização</Label><Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="São Paulo, BR" /></div>
          )}
          {type === "note" && (
            <div><Label>Texto</Label><Textarea value={form.text ?? ""} onChange={(e) => setForm({ ...form, text: e.target.value })} /></div>
          )}

          <Button onClick={submit} className="w-full rounded-xl bg-violet hover:bg-violet-glow">Adicionar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------- Edit Profile dialog -------- */

function EditProfileDialog({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    bio: profile.bio ?? "",
    avatar_url: profile.avatar_url ?? "",
    location: profile.location ?? "",
    skills: (profile.skills ?? []).join(", "),
  });

  const save = async () => {
    const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
    const { data, error } = await supabase.from("profiles").update({
      full_name: form.full_name, bio: form.bio,
      avatar_url: form.avatar_url || null, location: form.location || null,
      skills,
    }).eq("id", profile.id).select().single();
    if (error) { toast.error(error.message); return; }
    onSaved(data as Profile);
    toast.success("Perfil atualizado");
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Editar perfil</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Nome</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
        <div><Label>URL do avatar</Label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." /></div>
        <div><Label>Localização</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div><Label>Skills (separadas por vírgula)</Label><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Bubble, Figma" /></div>
        <Button onClick={save} className="w-full rounded-xl bg-violet hover:bg-violet-glow">Salvar</Button>
      </div>
    </DialogContent>
  );
}
