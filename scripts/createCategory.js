// Script to create a new category in Supabase
// Usage: node createCategory.js <category_name> <category_slug>

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const CATEGORY_NAME = process.argv[2];
const CATEGORY_SLUG = process.argv[3];

if (!CATEGORY_NAME || !CATEGORY_SLUG) {
  console.error(
    "Usage: node scripts/createCategory.js <category_name> <category_slug>"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createCategory(name, slug) {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug,
    })
    .select("*")
    .single();

  if (error) {
    console.error(`Error creating category '${name}':`, error.message);
  } else {
    console.log(`Created category: ${data.name} (ID: ${data.id})`);
  }
}

createCategory(CATEGORY_NAME, CATEGORY_SLUG);
