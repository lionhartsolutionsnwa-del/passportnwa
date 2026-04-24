// Shared blocklist used by import-restaurants.mjs and cleanup-chains.mjs.
// Matching: name is normalized to lowercase, whitespace collapsed; we check if
// ANY blocked phrase appears as a word-boundary match.
//
// Guidelines for what goes in here:
// - National / regional chains with multiple locations (not one-off franchises)
// - Fast food, fast casual with 10+ locations nationally
// - Gas station and convenience store food counters
// - National coffee / donut / smoothie chains

export const CHAIN_BLOCKLIST = [
  // --- FAST FOOD ---
  "mcdonald", "burger king", "wendy", "taco bell", "kfc", "popeye", "chick-fil-a", "chick fil a", "chickfila",
  "sonic drive", "sonic (", "hardee", "arby", "whataburger", "culver", "jack in the box",
  "carl's jr", "five guys", "in-n-out", "in n out", "raising cane", "zaxby", "bojangle",
  "church's chicken", "churchs chicken", "el pollo loco", "wingstop", "pollo tropical",

  // --- PIZZA CHAINS ---
  "papa john", "pizza hut", "domino", "little caesar", "papa murphy", "marco's pizza", "marcos pizza",
  "mellow mushroom", "mod pizza", "blaze pizza", "jet's pizza", "jets pizza",
  "cici's pizza", "cicis pizza", "hungry howie", "round table pizza",
  "pizza ranch", "pizza inn", "godfather's pizza", "sbarro",

  // --- SANDWICH / SUB CHAINS ---
  "subway", "jimmy john", "jersey mike", "firehouse subs", "jason's deli", "jasons deli",
  "mcalister", "panera", "which wich", "quiznos", "schlotzsky",
  "penn station", "erbert & gerbert", "charley's", "charleys",
  "togo's", "togos", "potbelly", "atlanta bread", "einstein bros", "einstein bagels",

  // --- FAST CASUAL ---
  "chipotle", "qdoba", "moe's southwest", "moes southwest", "pei wei", "panda express",
  "panda garden", "manchu wok", "fuzzy's taco", "fuzzys taco", "taco john", "del taco",
  "baja fresh", "rubio's", "costa vida", "cafe rio", "pancheros", "freebirds",
  "sweetgreen", "cava", "salata", "salad and go", "noodles & company", "noodles and company",
  "saladworks", "tropical smoothie", "smoothie king", "jamba",

  // --- CASUAL DINING ---
  "applebee", "chili's grill", "chilis grill", "olive garden", "longhorn", "outback steakhouse",
  "texas roadhouse", "red lobster", "cracker barrel", "ihop", "denny's", "dennys",
  "waffle house", "first watch", "another broken egg", "perkins",
  "ruby tuesday", "tgi fridays", "tgi friday", "fridays",
  "buffalo wild wing", "bdubs", "hooters", "twin peaks", "carraba", "carrabba",
  "maggiano", "buca di beppo", "romano's macaroni", "brio italian", "bravo italian",
  "cheesecake factory", "grand lux cafe", "p.f. chang", "pf chang", "p f chang",
  "bonefish grill", "joe's crab shack", "joes crab shack", "bahama breeze",
  "black bear diner", "bob evans", "mimi's cafe", "mimis cafe", "village inn",
  "cheddar's scratch", "cheddars scratch",

  // --- STEAKHOUSE CHAINS ---
  "ruth's chris", "ruths chris", "morton's the steakhouse", "mortons steakhouse",
  "capital grille", "fleming's prime", "flemings prime", "fogo de chao", "texas de brazil",
  "mccormick & schmick", "benihana",

  // --- COFFEE / DONUTS / DESSERT CHAINS ---
  "starbucks", "dunkin", "krispy kreme", "shipley", "tim horton",
  "caribou coffee", "peet's coffee", "peets coffee", "scooter's coffee", "scooters coffee",
  "7 brew", "seven brew", "dutch bros", "black rifle coffee", "pj's coffee", "pjs coffee",
  "coffee bean & tea leaf", "the coffee bean",
  "baskin-robbins", "baskin robbins", "dairy queen", "cold stone creamery",
  "orange leaf", "menchie", "yogurtland", "pinkberry", "red mango", "sixteen handles",
  "ben & jerry", "haagen-dazs", "haagen dazs", "marble slab", "bruster",
  "krispy kreme", "dippin' dots", "dippin dots",

  // --- BBQ CHAINS ---
  "dickey's barbecue", "dickeys barbecue", "famous dave", "mission bbq", "city barbeque",
  "smokey bones", "sonny's bbq", "sonnys bbq",

  // --- OTHER ---
  "boston market", "nando's", "nandos", "kenny rogers", "ted's montana", "teds montana",
  "pollo campero", "taco mayo", "taco casa",
  "cafe zupas", "pita pit", "which wich",

  // --- GAS STATIONS / CONVENIENCE FOOD ---
  "casey's general", "caseys general", "casey's", "caseys",
  "kum & go", "kum and go", "kwik trip", "kwik star",
  "wawa", "sheetz", "7-eleven", "7 eleven", "seven eleven",
  "circle k", "love's travel", "loves travel", "pilot travel", "flying j",
  "quiktrip", "quik trip", "qt kitchen",
  "maverik", "murphy usa", "murphy's usa", "phillips 66",
  "shell", "exxon", "chevron", "bp ", "conoco", "sunoco",
  "valero", "marathon", "speedway",

  // --- WAREHOUSE / BULK ---
  "costco", "sam's club", "sams club", "walmart deli", "walmart supercenter",
  "kroger deli", "target cafe",
];

// Google Place types to exclude entirely (regardless of name)
export const BLOCKED_TYPES = new Set([
  "gas_station",
  "convenience_store",
  "lodging",
  "movie_theater",
  "amusement_park",
  "stadium",
  "park",
  "grocery_store",
  "grocery_or_supermarket",
  "supermarket",
  "wholesaler",
  "department_store",
  "drugstore",
]);

/**
 * Returns true if the restaurant should be blocked from import.
 */
export function isBlocked({ name, types }) {
  const n = (name ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!n) return true;

  for (const phrase of CHAIN_BLOCKLIST) {
    if (n.includes(phrase)) return true;
  }

  for (const t of types ?? []) {
    if (BLOCKED_TYPES.has(t)) return true;
  }

  return false;
}
