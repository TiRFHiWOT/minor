// Script to scrape team names using Puppeteer (headless browser) and create topics in Supabase
// Usage: node scrapeAndCreateTopicsPuppeteer.js <category_id>

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const CATEGORY_ID = process.argv[2];
if (!CATEGORY_ID) {
  console.error(
    "Usage: node scripts/scrapeAndCreateTopicsPuppeteer.js <category_id>"
  );
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
  const url = "https://myhockeyrankings.com/associations";
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  // Set a real browser user-agent
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
  } catch (err) {
    console.error("Navigation error:", err.message);
    await browser.close();
    return [];
  }
  // Adjust selector as needed based on actual page structure
  const teamNames = await page.evaluate(() => {
    const names = [];
    document.querySelectorAll("table tr").forEach((row) => {
      const cols = row.querySelectorAll("td");
      if (cols.length > 1) {
        const name = cols[1].innerText.trim();
        if (name && name !== "Team") {
          names.push(name);
        }
      }
    });
    return names;
  });
  await browser.close();
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
