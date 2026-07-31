// Curated official coaching & refereeing resources per sport, added as links.
// category must match the resource_category enum; subcategory is
// "coaching_guides" or "refereeing_umpiring".
export type CuratedResource = {
  category: string;
  subcategory: "coaching_guides" | "refereeing_umpiring";
  title: string;
  description: string;
  url: string;
};

export const CURATED_RESOURCES: CuratedResource[] = [
  // ── Refereeing / Umpiring — official rules ──────────────
  {
    category: "football",
    subcategory: "refereeing_umpiring",
    title: "Laws of the Game (IFAB)",
    description: "The official Laws of the Game for football, published by the IFAB.",
    url: "https://www.theifab.com/laws-of-the-game-documents/",
  },
  {
    category: "rugby",
    subcategory: "refereeing_umpiring",
    title: "World Rugby Laws of the Game",
    description: "Official rugby union laws with definitions, match-official signals and clarifications.",
    url: "https://www.world.rugby/the-game/laws/law",
  },
  {
    category: "hockey",
    subcategory: "refereeing_umpiring",
    title: "FIH Rules of Hockey",
    description: "Official outdoor hockey rules from the International Hockey Federation.",
    url: "https://www.fih.hockey/about-fih/official-documents/rules-of-hockey",
  },
  {
    category: "netball",
    subcategory: "refereeing_umpiring",
    title: "World Netball – Rules of Netball (2024)",
    description: "The official Rules of Netball (2024 edition), including umpiring signals.",
    url: "https://netball.sport/wp-content/uploads/2024/01/World-Netball-Rules-Book-2024.pdf",
  },
  {
    category: "basketball",
    subcategory: "refereeing_umpiring",
    title: "FIBA Official Basketball Rules",
    description: "Official basketball rules, interpretations and referee resources from FIBA.",
    url: "https://about.fiba.basketball/en/services/resource-hub/downloads",
  },
  {
    category: "tennis",
    subcategory: "refereeing_umpiring",
    title: "ITF Rules of Tennis",
    description: "Official Rules of Tennis and regulations from the International Tennis Federation.",
    url: "https://www.itftennis.com/en/about-us/governance/rules-and-regulations/",
  },
  {
    category: "athletics",
    subcategory: "refereeing_umpiring",
    title: "World Athletics – Book of Rules",
    description: "Official competition and technical rules for track & field athletics.",
    url: "https://worldathletics.org/about-iaaf/documents/book-of-rules",
  },
  {
    category: "softball",
    subcategory: "refereeing_umpiring",
    title: "WBSC Softball – Game Rules",
    description: "Official softball playing rules and umpire manuals from the WBSC.",
    url: "https://www.wbsc.org/en/organisation/softball/game-rules",
  },
  {
    category: "swimming",
    subcategory: "refereeing_umpiring",
    title: "World Aquatics – Swimming Rules",
    description: "Official swimming competition rules from World Aquatics.",
    url: "https://www.worldaquatics.com/swimming/rules",
  },

  // ── Coaching Guides — official coaching & education hubs ──
  {
    category: "football",
    subcategory: "coaching_guides",
    title: "The FA – Coaching Hub",
    description: "Coaching sessions, drills and courses for football coaches.",
    url: "https://www.thefa.com/get-involved/coach",
  },
  {
    category: "rugby",
    subcategory: "coaching_guides",
    title: "World Rugby Passport – Coaching",
    description: "Free coaching modules and qualifications for rugby coaches.",
    url: "https://passport.world.rugby/",
  },
  {
    category: "basketball",
    subcategory: "coaching_guides",
    title: "FIBA – Coaching Resources",
    description: "Coaching manuals and materials from FIBA's resource hub.",
    url: "https://about.fiba.basketball/en/services/resource-hub/downloads",
  },
  {
    category: "hockey",
    subcategory: "coaching_guides",
    title: "FIH – Development & Coaching",
    description: "Coaching and development resources from the International Hockey Federation.",
    url: "https://www.fih.hockey/",
  },
  {
    category: "netball",
    subcategory: "coaching_guides",
    title: "World Netball – Coaching & Resources",
    description: "Coaching and development resources from World Netball.",
    url: "https://netball.sport/",
  },
  {
    category: "tennis",
    subcategory: "coaching_guides",
    title: "ITF – Coaching & Development",
    description: "Tennis coaching and player-development resources from the ITF.",
    url: "https://www.itftennis.com/",
  },
  {
    category: "athletics",
    subcategory: "coaching_guides",
    title: "World Athletics – Coaching & Education",
    description: "Coaching, education and development resources for athletics.",
    url: "https://worldathletics.org/",
  },
  {
    category: "swimming",
    subcategory: "coaching_guides",
    title: "World Aquatics – Development",
    description: "Coaching and development resources from World Aquatics.",
    url: "https://www.worldaquatics.com/",
  },
];
