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
  // Updated selector for associations page structure
  const teamNames = await page.evaluate(() => {
    // Find all anchor tags that link to /association-info?a=...
    const anchors = Array.from(
      document.querySelectorAll('a[href^="/association-info?a="]')
    );
    // Get the visible text of each anchor, filter out empty or duplicate names
    const names = anchors.map((a) => a.textContent.trim()).filter(Boolean);
    // Remove duplicates (some associations may appear more than once)
    return Array.from(new Set(names));
  });
  await browser.close();
  return teamNames;
}

async function createTopic(title, category_id) {
  const slug = slugify(title);
  // Format content as: Let's talk about [team], [city], [state]
  let content = "";
  const parts = title.split(",").map((s) => s.trim());
  if (parts.length >= 3) {
    const state = parts[parts.length - 1];
    const city = parts[parts.length - 2];
    const team = parts.slice(0, -2).join(", ");
    content = `Let's talk about ${team}, ${city}, ${state}`;
  } else if (parts.length === 2) {
    // Assume: [team and city], [state]  => split last word of first part as city
    const teamAndCity = parts[0].trim();
    const state = parts[1].trim();
    const teamCityParts = teamAndCity.split(" ");
    if (teamCityParts.length >= 2) {
      const city = teamCityParts[teamCityParts.length - 1];
      const team = teamCityParts.slice(0, -1).join(" ").trim();
      content = `Let's talk about ${team},${city}, ${state}`.replace(
        /,\s*/,
        ", "
      );
    } else {
      content = `Let's talk about ${teamAndCity}, ${state}`;
    }
  } else {
    content = `Let's talk about ${title}`;
  }
  const { data, error } = await supabase
    .from("topics")
    .insert({
      title,
      slug,
      content,
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
  let teamNames = await fetchTeamNames();
  // Exclude topics that already exist in Supabase (by title, normalized)
  function normalize(str) {
    return str.replace(/\s+/g, " ").replace(/\n/g, "").trim();
  }
  // Fetch all existing topic titles in this category
  const { data: existingTopics, error: fetchError } = await supabase
    .from("topics")
    .select("title")
    .eq("category_id", CATEGORY_ID);
  let existingTitles = [];
  if (fetchError) {
    console.error("Error fetching existing topics:", fetchError.message);
  } else if (existingTopics) {
    existingTitles = existingTopics.map((t) => normalize(t.title));
  }
  teamNames = teamNames.filter(
    (name) => !existingTitles.includes(normalize(name))
  );
  console.log(
    `Found ${teamNames.length} teams after excluding already-created topics.`
  );
  // Only create two topics for testing
  for (const name of teamNames.slice(0, 2)) {
    await createTopic(name, CATEGORY_ID);
  }
  console.log("Done! (Created 2 topics for testing)");
}

main();
