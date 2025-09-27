// updateCategorySlug.js
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSlug() {
  const { data, error } = await supabase
    .from("categories")
    .update({ slug: "teams-associations-usa" })
    .eq("slug", "teams-and-associations")
    .eq("parent_category_id", "22222222-2222-2222-2222-222222222222");

  if (error) {
    console.error("Error updating slug:", error);
  } else {
    console.log("Slug updated:", data);
  }
}

updateSlug();
