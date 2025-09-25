// Script to scrape team names from myhockeyrankings.com and create topics in Supabase
// Usage: node scrapeAndCreateTopics.js <category_id>

const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const CATEGORY_ID = process.argv[2];
if (!CATEGORY_ID) {
  console.error("Usage: node scripts/scrapeAndCreateTopics.js <category_id>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchTeamNames() {
  const url =
    "https://myhockeyrankings.com/rank.php?y=2025&v=116&d=MI&view=alphabetic";
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  const teamNames = [];
  // Find all table rows, then get the second column (team name)
  $("table tr").each((i, row) => {
    const cols = $(row).find("td");
    if (cols.length > 1) {
      const name = $(cols[1]).text().trim();
      // Filter out empty and header rows
      if (name && name !== "Team") {
        teamNames.push(name);
      }
    }
  });
  return teamNames;
}

async function createTopic(title, category_id) {
  const slug = slugify(title);
  const { data, error } = await supabase
    .from("topics")
    .insert({
      title,
      slug,
      content: "",
      category_id,
      moderation_status: "approved",
      is_anonymous: false,
      author_id: null,
      ip_address: "127.0.0.1",
    })
    .select("*")
    .single();
  if (error) {
    console.error(`Error creating topic \"${title}\":`, error.message);
  } else {
    console.log(`Created topic: ${data.title}`);
  }
}

async function main() {
  const teamNames = await fetchTeamNames();
  console.log(`Found ${teamNames.length} teams.`);
  for (const name of teamNames) {
    await createTopic(name, CATEGORY_ID);
  }
  console.log("Done!");
}

main();
