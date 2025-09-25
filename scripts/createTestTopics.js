// Script to insert test topics into a test category using Supabase
// Usage: node createTestTopics.js
// category: test category (ID: 1d4fc366-d6aa-44f8-b46e-7bf036be5da1)

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

// Load from .env
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Get category ID from command line argument
const TEST_CATEGORY_ID = process.argv[2];
if (!TEST_CATEGORY_ID) {
  console.error("Usage: node scripts/createTestTopics.js <category_id>");
  process.exit(1);
}

// Example team names for testing
const teamNames = ["Test Team One", "Test Team Two", "Test Team Three"];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^a-z0-9\-]/g, "") // Remove all non-alphanumeric and non-hyphen
    .replace(/-+/g, "-") // Replace multiple - with single -
    .replace(/^-+|-+$/g, ""); // Trim - from start/end
}

async function createTopic(title, category_id) {
  const slug = slugify(title);
  const { data, error } = await supabase
    .from("topics")
    .insert({
      title,
      slug,
      content: "", // You can add a default or custom content here
      category_id,
      moderation_status: "approved",
      is_anonymous: false,
      author_id: null, // Or set to a test user id if needed
      ip_address: "127.0.0.1", // Default IP for test data
    })
    .select("*")
    .single();

  if (error) {
    console.error(`Error creating topic "${title}":`, error.message);
  } else {
    console.log(`Created topic: ${data.title}`);
  }
}

async function main() {
  for (const name of teamNames) {
    await createTopic(name, TEST_CATEGORY_ID);
  }
  console.log("Done!");
}

main();
