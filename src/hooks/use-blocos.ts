import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Bloco, TipoBloco, ConteudoBloco } from "@/lib/bloco-types";
import { queryKeys } from "@/lib/query-keys";
import type { Json } from "@/integrations/supabase/types";

async function fetchBlocos(perfilId: number, incluirOcultos: boolean) {
  let q = supabase.from("blocos").select("*").eq("perfil_id", perfilId).order("ordem", { ascending: true });
  if (!incluirOcultos) q = q.eq("visivel", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Bloco[];
}

export function useBlocos(perfilId: number | undefined, incluirOcultos = false) {
  return useQuery({
    queryKey: queryKeys.blocos(perfilId ?? 0, incluirOcultos),
    queryFn: () => fetchBlocos(perfilId!, incluirOcultos),
    enabled: !!perfilId,
  });
}

export function useCriarBloco(perfilId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      tipo: TipoBloco;
      titulo?: string;
      conteudo: ConteudoBloco;
      colunas?: number;
      linhas?: number;
      ordem: number;
    }) => {
      const { data, error } = await supabase
        .from("blocos")
        .insert({
          perfil_id: perfilId,
          tipo: input.tipo,
          titulo: input.titulo ?? null,
          conteudo: input.conteudo as Json,
          colunas: input.colunas ?? 1,
          linhas: input.linhas ?? 1,
          ordem: input.ordem,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Bloco;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocos", perfilId] });
    },
  });
}

export function useAtualizarBloco(perfilId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: number;
      tipo?: TipoBloco;
      titulo?: string | null;
      conteudo?: ConteudoBloco;
      colunas?: number;
      linhas?: number;
      visivel?: boolean;
    }) => {
      const { id, ...updates } = input;
      const payload: Record<string, unknown> = { ...updates };
      if (updates.conteudo) payload.conteudo = updates.conteudo as Json;
      const { data, error } = await supabase.from("blocos").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data as Bloco;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocos", perfilId] });
    },
  });
}

export function useExcluirBloco(perfilId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("blocos").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      const key = queryKeys.blocos(perfilId, true);
      await queryClient.cancelQueries({ queryKey: key });
      const anterior = queryClient.getQueryData<Bloco[]>(key);
      queryClient.setQueryData<Bloco[]>(key, (old) => old?.filter((b) => b.id !== id) ?? []);
      return { anterior };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.anterior) {
        queryClient.setQueryData(queryKeys.blocos(perfilId, true), ctx.anterior);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["blocos", perfilId] });
    },
  });
}

export function useReordenarBlocos(perfilId: number) {
  const queryClient = useQueryClient();
  const keyOwner = queryKeys.blocos(perfilId, true);
  const keyPublic = queryKeys.blocos(perfilId, false);

  return useMutation({
    mutationFn: async (ordenados: Bloco[]) => {
      await Promise.all(
        ordenados.map((b, i) =>
          supabase.from("blocos").update({ ordem: i }).eq("id", b.id),
        ),
      );
      return ordenados.map((b, i) => ({ ...b, ordem: i }));
    },
    onMutate: async (ordenados) => {
      await queryClient.cancelQueries({ queryKey: ["blocos", perfilId] });
      const anteriorOwner = queryClient.getQueryData<Bloco[]>(keyOwner);
      const anteriorPublic = queryClient.getQueryData<Bloco[]>(keyPublic);
      const reindexed = ordenados.map((b, i) => ({ ...b, ordem: i }));
      queryClient.setQueryData(keyOwner, reindexed);
      queryClient.setQueryData(
        keyPublic,
        reindexed.filter((b) => b.visivel),
      );
      return { anteriorOwner, anteriorPublic };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.anteriorOwner) queryClient.setQueryData(keyOwner, ctx.anteriorOwner);
      if (ctx?.anteriorPublic) queryClient.setQueryData(keyPublic, ctx.anteriorPublic);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["blocos", perfilId] });
    },
  });
}
