import { useEffect, useState } from "react";
import type { Bloco, TipoBloco, ConteudoBloco } from "@/lib/bloco-types";
import { TIPOS_BLOCO } from "@/lib/bloco-types";
import { uploadBlocoImagem, validateImageFile } from "@/lib/storage-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export interface BlocoFormValues {
  tipo: TipoBloco;
  titulo: string;
  colunas: number;
  linhas: number;
  conteudo: ConteudoBloco;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bloco?: Bloco | null;
  usuarioId: string;
  onSubmit: (values: BlocoFormValues) => void;
  loading?: boolean;
}

const defaults: BlocoFormValues = {
  tipo: "link",
  titulo: "",
  colunas: 1,
  linhas: 1,
  conteudo: {},
};

export function BlocoFormDialog({
  open,
  onOpenChange,
  bloco,
  usuarioId,
  onSubmit,
  loading,
}: Props) {
  const [form, setForm] = useState<BlocoFormValues>(defaults);
  const [rawConteudo, setRawConteudo] = useState<Record<string, string | boolean>>({});
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setImagemFile(null);
    if (bloco) {
      const c = (bloco.conteudo ?? {}) as Record<string, string | boolean | number>;
      setForm({
        tipo: bloco.tipo as TipoBloco,
        titulo: bloco.titulo ?? "",
        colunas: bloco.colunas,
        linhas: bloco.linhas,
        conteudo: bloco.conteudo as ConteudoBloco,
      });
      setRawConteudo(
        Object.fromEntries(
          Object.entries(c).map(([k, v]) => [k, typeof v === "boolean" ? v : String(v ?? "")]),
        ) as Record<string, string | boolean>,
      );
    } else {
      setForm(defaults);
      setRawConteudo({});
    }
  }, [open, bloco]);

  const setField = (key: string, value: string | boolean) => {
    setRawConteudo((prev) => ({ ...prev, [key]: value }));
  };

  const buildConteudo = (): ConteudoBloco => {
    switch (form.tipo) {
      case "link":
        return { url: String(rawConteudo.url ?? ""), rotulo: String(rawConteudo.rotulo ?? "") };
      case "imagem":
        return { url: String(rawConteudo.url ?? ""), legenda: String(rawConteudo.legenda ?? "") };
      case "texto":
        return {
          texto: String(rawConteudo.texto ?? ""),
          tipo_copia: Boolean(rawConteudo.tipo_copia),
        };
      case "mapa":
        return {
          lat: rawConteudo.lat ? Number(rawConteudo.lat) : undefined,
          lng: rawConteudo.lng ? Number(rawConteudo.lng) : undefined,
          endereco: String(rawConteudo.endereco ?? ""),
        };
      case "video":
        return { url: String(rawConteudo.url ?? "") };
      case "newsletter":
        return {
          titulo: String(rawConteudo.titulo ?? ""),
          descricao: String(rawConteudo.descricao ?? ""),
        };
      default:
        return {};
    }
  };

  const handleSubmit = async () => {
    if (form.tipo === "imagem") {
      const urlAtual = String(rawConteudo.url ?? "").trim();
      if (!imagemFile && !urlAtual) {
        toast.error("Envie uma imagem do computador ou informe uma URL.");
        return;
      }
      if (imagemFile) {
        setUploading(true);
        try {
          validateImageFile(imagemFile);
          const publicUrl = await uploadBlocoImagem(usuarioId, imagemFile);
          setRawConteudo((prev) => ({ ...prev, url: publicUrl }));
          onSubmit({
            ...form,
            conteudo: { url: publicUrl, legenda: String(rawConteudo.legenda ?? "") },
          });
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Erro no upload");
        } finally {
          setUploading(false);
        }
        return;
      }
    }

    onSubmit({
      ...form,
      conteudo: buildConteudo(),
    });
  };

  const busy = loading || uploading;
  const previewUrl = imagemFile
    ? URL.createObjectURL(imagemFile)
    : String(rawConteudo.url ?? "") || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bloco ? "Editar bloco" : "Novo bloco"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <Select
              value={form.tipo}
              onValueChange={(v) => {
                setForm((f) => ({ ...f, tipo: v as TipoBloco }));
                setImagemFile(null);
              }}
              disabled={!!bloco}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_BLOCO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Título (opcional)</Label>
            <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Colunas (1–4)</Label>
              <Select
                value={String(form.colunas)}
                onValueChange={(v) => setForm((f) => ({ ...f, colunas: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Linhas (1–2)</Label>
              <Select
                value={String(form.linhas)}
                onValueChange={(v) => setForm((f) => ({ ...f, linhas: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.tipo === "link" && (
            <>
              <div>
                <Label>Rótulo</Label>
                <Input value={String(rawConteudo.rotulo ?? "")} onChange={(e) => setField("rotulo", e.target.value)} />
              </div>
              <div>
                <Label>URL</Label>
                <Input value={String(rawConteudo.url ?? "")} onChange={(e) => setField("url", e.target.value)} placeholder="https://..." />
              </div>
            </>
          )}

          {form.tipo === "imagem" && (
            <>
              <div>
                <Label>Enviar do computador</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setImagemFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP ou GIF — até 5MB</p>
              </div>

              {previewUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-800 aspect-video max-h-40">
                  <img src={previewUrl} alt="Prévia" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="h-px bg-border flex-1" />
                <span className="text-xs text-muted-foreground">ou URL externa</span>
                <div className="h-px bg-border flex-1" />
              </div>

              <div>
                <Label>URL da imagem</Label>
                <Input
                  value={String(rawConteudo.url ?? "")}
                  onChange={(e) => {
                    setField("url", e.target.value);
                    setImagemFile(null);
                  }}
                  placeholder="https://..."
                  disabled={!!imagemFile}
                />
              </div>
              <div>
                <Label>Legenda</Label>
                <Input value={String(rawConteudo.legenda ?? "")} onChange={(e) => setField("legenda", e.target.value)} />
              </div>
            </>
          )}

          {form.tipo === "texto" && (
            <>
              <div>
                <Label>Texto</Label>
                <Textarea value={String(rawConteudo.texto ?? "")} onChange={(e) => setField("texto", e.target.value)} rows={3} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="tipo_copia"
                  checked={Boolean(rawConteudo.tipo_copia)}
                  onCheckedChange={(c) => setField("tipo_copia", !!c)}
                />
                <Label htmlFor="tipo_copia">Permitir copiar (Pix, email, etc.)</Label>
              </div>
            </>
          )}

          {form.tipo === "mapa" && (
            <>
              <div>
                <Label>Endereço</Label>
                <Input value={String(rawConteudo.endereco ?? "")} onChange={(e) => setField("endereco", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Latitude</Label>
                  <Input value={String(rawConteudo.lat ?? "")} onChange={(e) => setField("lat", e.target.value)} />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input value={String(rawConteudo.lng ?? "")} onChange={(e) => setField("lng", e.target.value)} />
                </div>
              </div>
            </>
          )}

          {form.tipo === "video" && (
            <div>
              <Label>URL do YouTube</Label>
              <Input value={String(rawConteudo.url ?? "")} onChange={(e) => setField("url", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            </div>
          )}

          {form.tipo === "newsletter" && (
            <>
              <div>
                <Label>Título</Label>
                <Input value={String(rawConteudo.titulo ?? "")} onChange={(e) => setField("titulo", e.target.value)} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={String(rawConteudo.descricao ?? "")} onChange={(e) => setField("descricao", e.target.value)} rows={2} />
              </div>
            </>
          )}

          <Button
            onClick={() => void handleSubmit()}
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Enviando imagem…" : bloco ? "Salvar" : "Adicionar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

