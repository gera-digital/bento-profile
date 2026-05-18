export const queryKeys = {
  perfilPorSlug: (slug: string) => ["perfil", slug] as const,
  perfilPorUsuario: (usuarioId: string) => ["perfil", "usuario", usuarioId] as const,
  blocos: (perfilId: number, incluirOcultos?: boolean) =>
    ["blocos", perfilId, incluirOcultos ?? false] as const,
};
