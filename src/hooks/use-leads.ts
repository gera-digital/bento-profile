import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCriarLead(perfilId: number) {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.from("leads").insert({ perfil_id: perfilId, email });
      if (error) throw error;
    },
  });
}
