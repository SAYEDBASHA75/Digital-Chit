import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

export const supabaseClient = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);
