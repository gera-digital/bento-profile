export type WidgetSize = "1x1" | "2x1" | "1x2" | "2x2";

export type WidgetType =
  | "profile"
  | "social"
  | "link"
  | "showcase"
  | "newsletter"
  | "map"
  | "note";

export interface WidgetContent {
  // social
  platform?: "instagram" | "linkedin" | "github" | "youtube" | "twitter" | "twitch";
  url?: string;
  // link / showcase
  title?: string;
  subtitle?: string;
  image_url?: string;
  // newsletter
  heading?: string;
  description?: string;
  // map
  location?: string;
  // note
  text?: string;
}

export interface Widget {
  id: string;
  profile_id: string;
  type: WidgetType;
  content: WidgetContent;
  position_index: number;
  size: WidgetSize;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  skills: string[] | null;
}
