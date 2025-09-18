// Script to insert test topics into a test category using Supabase
// Usage: node createTestTopics.js

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Load from .env
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// TODO: Replace with your test category_id (string, not name)
const TEST_CATEGORY_ID = "YOUR_TEST_CATEGORY_ID_HERE";

// Example team names for testing
const teamNames = ["Test Team One", "Test Team Two", "Test Team Three"];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createTopic(title, category_id) {
  const { data, error } = await supabase
    .from("topics")
    .insert({
      title,
      content: "", // You can add a default or custom content here
      category_id,
      moderation_status: "approved",
      is_anonymous: false,
      author_id: null, // Or set to a test user id if needed
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
