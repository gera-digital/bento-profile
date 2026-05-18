import { supabase } from "@/integrations/supabase/client";
import { garantirPerfil } from "@/hooks/use-perfil";

export async function redirectParaMeuPerfil(
  navigate: (opts: { to: string; params: { slug: string } }) => void,
  user: { id: string; email?: string },
) {
  const { data } = await supabase.from("perfis").select("slug").eq("usuario_id", user.id).maybeSingle();
  if (data?.slug) {
    navigate({ to: "/$slug", params: { slug: data.slug } });
    return;
  }
  try {
    const perfil = await garantirPerfil(user.id, user.email ?? "user@local.dev");
    navigate({ to: "/$slug", params: { slug: perfil.slug } });
  } catch {
    navigate({ to: "/$slug", params: { slug: "demo" } });
  }
}
