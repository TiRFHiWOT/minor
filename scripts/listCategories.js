// Script to list all categories and their IDs from Supabase
// Usage: node listCategories.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug");

  if (error) {
    console.error("Error fetching categories:", error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No categories found.");
    return;
  }

  console.log("Categories:");
  data.forEach((cat) => {
    console.log(`Name: ${cat.name} | Slug: ${cat.slug} | ID: ${cat.id}`);
  });
}

await listCategories();
