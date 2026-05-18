import { supabase } from "@/integrations/supabase/client";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function extFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[file.type] ?? "jpg";
}

export function validateImageFile(file: File, maxMb = 5): void {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error("Formato inválido. Use JPEG, PNG, WebP ou GIF.");
  }
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(`Arquivo muito grande. Máximo ${maxMb}MB.`);
  }
}

export async function uploadAvatar(usuarioId: string, file: File): Promise<string> {
  validateImageFile(file);
  const ext = extFromFile(file);
  const path = `${usuarioId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

export async function uploadBlocoImagem(usuarioId: string, file: File): Promise<string> {
  validateImageFile(file);
  const ext = extFromFile(file);
  const path = `${usuarioId}/blocos/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}
