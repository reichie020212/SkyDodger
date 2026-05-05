// Sky Dodger — Prisma seed
// Populates the Badge table from the prototype's BADGES array. Glyphs and
// copy come from legacy/data.js; thresholds and categories follow the
// Blueprint badge table.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedBadge = {
  id: string;
  name: string;
  description: string;
  glyph: string;
  threshold: number;
  category: "score" | "difficulty" | "streak" | "rank" | "time";
};

const badges: SeedBadge[] = [
  { id: "first_flight",  name: "First Flight", description: "Play your first game",          glyph: "✦", threshold: 1,   category: "score" },
  { id: "ten_pipes",     name: "Getting Air",  description: "Pass 10 obstacles",             glyph: "◆", threshold: 10,  category: "score" },
  { id: "fifty_pipes",   name: "Sky Cruiser",  description: "Pass 50 obstacles in one run",  glyph: "✷", threshold: 50,  category: "score" },
  { id: "hundred_pipes", name: "Centurion",    description: "Pass 100 in a single flight",   glyph: "✺", threshold: 100, category: "score" },
  { id: "hard_mode",     name: "Hard Knocks",  description: "Beat 25 on Hard",               glyph: "▲", threshold: 25,  category: "difficulty" },
  { id: "insane_mode",   name: "Unhinged",     description: "Beat 15 on Insane",             glyph: "✦", threshold: 15,  category: "difficulty" },
  { id: "streak_7",      name: "Week Warrior", description: "Play 7 days in a row",          glyph: "◐", threshold: 7,   category: "streak" },
  { id: "top_100",       name: "Top 100",      description: "Reach global top 100",          glyph: "★", threshold: 100, category: "rank" },
  { id: "top_10",        name: "Top 10",       description: "Reach global top 10",           glyph: "✸", threshold: 10,  category: "rank" },
  { id: "night_owl",     name: "Night Owl",    description: "Play after midnight",           glyph: "☾", threshold: 0,   category: "time" },
];

async function main() {
  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { id: badge.id },
      create: badge,
      update: badge,
    });
  }
  console.log(`Seeded ${badges.length} badges.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
