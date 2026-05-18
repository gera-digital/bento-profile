import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Perfil } from "@/lib/bloco-types";
import { queryKeys } from "@/lib/query-keys";

export function usePerfilPorSlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.perfilPorSlug(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Perfil | null;
    },
    enabled: !!slug,
  });
}

export function usePerfilPorUsuario(usuarioId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.perfilPorUsuario(usuarioId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("usuario_id", usuarioId!)
        .maybeSingle();
      if (error) throw error;
      return data as Perfil | null;
    },
    enabled: !!usuarioId,
  });
}

export function useAtualizarPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: number;
      slug: string;
      updates: Partial<Pick<Perfil, "nome_completo" | "bio" | "avatar_url" | "slug" | "configuracao_tema">>;
    }) => {
      const { data, error } = await supabase
        .from("perfis")
        .update(input.updates)
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data as Perfil;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.perfilPorSlug(data.slug), data);
      queryClient.setQueryData(queryKeys.perfilPorUsuario(data.usuario_id), data);
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
    },
  });
}

export async function garantirPerfil(usuarioId: string, email: string): Promise<Perfil> {
  const { data: existente } = await supabase
    .from("perfis")
    .select("*")
    .eq("usuario_id", usuarioId)
    .maybeSingle();
  if (existente) return existente as Perfil;

  const base = email.split("@")[0]?.replace(/[^a-z0-9_]/gi, "").toLowerCase() || "user";
  let slug = base || "user";
  let counter = 0;
  while (true) {
    const { data: taken } = await supabase.from("perfis").select("id").eq("slug", slug).maybeSingle();
    if (!taken) break;
    counter += 1;
    slug = `${base}${counter}`;
  }

  const { data, error } = await supabase
    .from("perfis")
    .insert({ usuario_id: usuarioId, slug })
    .select()
    .single();
  if (error) throw error;
  return data as Perfil;
}
