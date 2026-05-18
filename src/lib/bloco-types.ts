import type { Tables } from "@/integrations/supabase/types";

export type Perfil = Tables<"perfis">;
export type Bloco = Tables<"blocos">;

export type TipoBloco = "link" | "imagem" | "texto" | "mapa" | "video" | "newsletter";

export type ConteudoLink = { url?: string; rotulo?: string };
export type ConteudoImagem = { url?: string; legenda?: string };
export type ConteudoTexto = { texto?: string; tipo_copia?: boolean };
export type ConteudoMapa = { lat?: number; lng?: number; endereco?: string };
export type ConteudoVideo = { url?: string };
export type ConteudoNewsletter = { titulo?: string; descricao?: string };

export type ConteudoBloco =
  | ConteudoLink
  | ConteudoImagem
  | ConteudoTexto
  | ConteudoMapa
  | ConteudoVideo
  | ConteudoNewsletter;

export type RedeSocial = {
  plataforma: string;
  url: string;
};

export type ConfiguracaoTema = {
  redes_sociais?: RedeSocial[];
};

export function parseConteudo<T extends ConteudoBloco>(conteudo: unknown): T {
  if (conteudo && typeof conteudo === "object" && !Array.isArray(conteudo)) {
    return conteudo as T;
  }
  return {} as T;
}

export function parseConfiguracaoTema(raw: unknown): ConfiguracaoTema {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as ConfiguracaoTema;
  }
  return {};
}

export function colSpanClass(colunas: number) {
  const n = Math.min(4, Math.max(1, colunas));
  return (
    {
      1: "col-span-1",
      2: "col-span-2",
      3: "col-span-3",
      4: "col-span-4",
    } as const
  )[n];
}

export function rowSpanClass(linhas: number) {
  const n = Math.min(2, Math.max(1, linhas));
  return n === 2 ? "row-span-2 min-h-[380px]" : "row-span-1 min-h-[180px]";
}

export const TIPOS_BLOCO: { value: TipoBloco; label: string }[] = [
  { value: "link", label: "Link" },
  { value: "imagem", label: "Imagem" },
  { value: "texto", label: "Texto / Cópia" },
  { value: "mapa", label: "Mapa" },
  { value: "video", label: "YouTube" },
  { value: "newsletter", label: "Newsletter" },
];
