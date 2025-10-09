// Progressive memory store (category weights per keyword)
let keywordScores = JSON.parse(
  localStorage.getItem("expenseKeywordScores") || "{}"
);

  const categories = {
    Groceries: [
      "grocery",
      "supermarket",
      "market",
      "meituan",
      "water",
      // Common grocery items
      "vegetable",
      "fruit",
      "fruits",
      "veggies",
      "produce",
      "greens",
      "tomato",
      "onion",
      "potato",
      "garlic",
      "ginger",
      "apple",
      "banana",
      "mango",
      "strawberry",
      "grapes",
      "orange",
      "lemon",
      "melon",

      // Dairy
      "milk",
      "cheese",
      "butter",
      "cream",
      "yogurt",
      "curd",
      "paneer",

      // Staples
      "bread",
      "rice",
      "pasta",
      "noodles",
      "flour",
      "atta",
      "sugar",
      "salt",
      "oil",
      "olive oil",
      "sunflower oil",
      "soy sauce",
      "vinegar",
      "spices",

      // Proteins
      "chicken",
      "beef",
      "mutton",
      "fish",
      "pork",
      "egg",
      "eggs",
      "tofu",

      // Packaged goods
      "cereal",
      "chips",
      "snacks",
      "biscuits",
      "cookies",
      "crackers",
      "popcorn",
      "frozen",
      "ice cream",
      "frozen pizza",
      "instant noodles",

      // Beverages
      "water bottle",
      "mineral water",
      "soda",
      "soft drink",
      "coca cola",
      "pepsi",
      "juice",
      "orange juice",
      "apple juice",
      "energy drink",
      "gatorade",
      "red bull",

      // Household essentials
      "toilet paper",
      "paper towel",
      "detergent",
      "soap",
      "shampoo",
      "toothpaste",
      "cleaning supplies",
      "dish soap",
      "sanitizer",
      "hand wash",

      // Regional markets / generic
      "wet market",
      "farmers market",
      "local market",
      "kirana",
      "mandi",
      "bazaar",
      "provision store",
      "mini mart",
      "corner store",
      "bodega",
    ],
    Restaurant: [
      // General
      "restaurant",
      "diner",
      "eatery",
      "canteen",
      "cafe",
      "coffee shop",
      "bar",
      "pub",
      "bistro",
      "buffet",
      "steakhouse",
      "grill",
      "takeout",
      "delivery",

      // Common words in bills
      "dinner",
      "lunch",
      "breakfast",
      "brunch",
      "meal",
      "combo",
      "set menu",
      "table service",
      "reservation",
      "bill",
      "check",
      "tip",

      // Fast food chains (global)
      "mcdonald",
      "burger king",
      "kfc",
      "subway",
      "domino",
      "papa john",
      "pizza hut",
      "taco bell",
      "wendy's",
      "arbys",
      "dairy queen",
      "five guys",
      "chipotle",

      // Coffee & bakery
      "starbucks",
      "costa",
      "dunkin",
      "tim hortons",
      "peet's",
      "blue bottle",
      "cinnabon",
      "panera",
      "pret a manger",
      "caribou coffee",

      // Asian cuisines
      "ramen",
      "sushi",
      "izakaya",
      "kbbq",
      "korean bbq",
      "dim sum",
      "dumpling",
      "hotpot",
      "pho",
      "banh mi",
      "thai",
      "indian curry",
      "biryani",
      "naan",

      // Western cuisines
      "italian",
      "pizza",
      "pasta",
      "spaghetti",
      "lasagna",
      "risotto",
      "french",
      "bakery",
      "croissant",
      "boulangerie",
      "patisserie",

      // Other cuisines
      "mexican",
      "taco",
      "quesadilla",
      "enchilada",
      "burrito",
      "greek",
      "gyros",
      "souvlaki",
      "falafel",
      "shawarma",
      "kebab",
      "turkish",
      "lebanese",
      "mediterranean",
      "ethiopian",

      // Chains in Asia (examples)
      "jollibee",
      "hawker",
      "food court",
      "food stall",
      "chaat",
      "paratha",
      "thali",
      "idli",
      "dosa",
      "masala",

      // Indicators of cooked/prepared food
      "grilled",
      "fried",
      "roast",
      "roasted",
      "cooked",
      "chef",
      "menu",
      "dish",
    ],
    Shopping: [
      "shopping",
      "mall",
      "clothes",
      "fashion",
      "zara",
      "h&m",
      "nike",
      "adidas",
      "uniqlo",
      "sephora",
      "makeup",
      "electronics",
      "amazon",
      "target",
      "ebay",
      "phone",
      "laptop",
      "computer",
      "apple",
      "samsung",
    ],
    Travel: [
      "flight",
      "airfare",
      "plane",
      "airline",
      "uber",
      "lyft",
      "taxi",
      "bus",
      "train",
      "subway",
      "metro",
      "ferry",
      "hotel",
      "hostel",
      "airbnb",
      "travel",
      "trip",
      "vacation",
    ],
    Rent: [
      "rent",
      "apartment",
      "lease",
      "condo",
      "flat",
      "landlord",
      "housing",
      "mortgage",
      "utilities",
      "hoa",
    ],
    Healthcare: [
      "doctor",
      "hospital",
      "clinic",
      "dentist",
      "pharmacy",
      "medicine",
      "drugs",
      "healthcare",
      "insurance",
      "surgery",
      "lab test",
      "optician",
    ],
    Entertainment: [
      "cinema",
      "movie",
      "theater",
      "theatre",
      "imax",
      "film",
      "concert",
      "gig",
      "festival",
      "music",
      "band",
      "live show",
      "performance",
      "netflix",
      "hulu",
      "disney+",
      "prime video",
      "hbo",
      "apple tv",
      "spotify",
      "youtube premium",
      "arcade",
      "bowling",
      "karaoke",
      "pool hall",
      "billiards",
      "laser tag",
      "escape room",
      "amusement park",
      "theme park",
      "disneyland",
      "universal studios",
      "six flags",
      "roller coaster",
      "museum",
      "gallery",
      "zoo",
      "aquarium",
      "exhibit",
      "sports event",
      "nba",
      "nfl",
      "mlb",
      "nhl",
      "soccer",
      "football",
      "basketball",
      "tennis",
      "cricket",
      "stand-up",
      "comedy",
      "club",
      "nightclub",
      "dj",
      "bar",
      "casino",
      "lottery",
      "gambling",
      "poker",
      "slots",
      "betting",
      "wager",
      "draftkings",
      "fanduel",
      "books",
      "novel",
      "ebook",
      "comic",
      "manga",
      "audible",
      "games",
      "video game",
      "xbox",
      "playstation",
      "nintendo",
      "steam",
      "epic games",
      "gaming",
    ],
    Utilities: [
      "electricity",
      "water bill",
      "gas bill",
      "internet",
      "wifi",
      "phone bill",
      "mobile",
      "heating",
      "cooling",
      "bill",
      "esim",
      "sim",
      "sim",
    ],
    Education: [
      "school",
      "university",
      "college",
      "course",
      "online class",
      "tuition",
      "books",
      "textbook",
      "training",
      "udemy",
      "coursera",
    ],
    General: [
      "misc",
      "other",
      "unknown",
      "general",
      "various",
      "random",
      "miscellaneous",
      "everyday",
    ],
  };


function saveOverride(description, category) {
  description = description.toLowerCase().trim();
  let keywords = description.split(/\s+/).filter((w) => w.length > 3);

  keywords.forEach((word) => {
    if (!keywordScores[word]) keywordScores[word] = {};
    if (!keywordScores[word][category]) keywordScores[word][category] = 0;
    keywordScores[word][category] += 1; // Increase weight
  });

  localStorage.setItem("expenseKeywordScores", JSON.stringify(keywordScores));
}

// Keyword-based categorizer with progressive learning
function categorizeExpense(description) {
  description = description.toLowerCase();
  let words = description.split(/\s+/);

  let scores = {};

  // 1. Apply learned scores
  words.forEach((word) => {
    if (keywordScores[word]) {
      for (let cat in keywordScores[word]) {
        scores[cat] = (scores[cat] || 0) + keywordScores[word][cat];
      }
    }
  });

  // 2. If nothing strong in learned memory, fall back to keyword matching
  if (Object.keys(scores).length === 0) {
    for (let category in categories) {
      scores[category] = categories[category].reduce((count, keyword) => {
        return count + (description.includes(keyword) ? 1 : 0);
      }, 0);
    }
  }

  // 3. Pick best category
  let bestCategory = Object.keys(scores).reduce(
    (a, b) => (scores[a] >= scores[b] ? a : b),
    "General"
  );
  return scores[bestCategory] > 0 ? bestCategory : "General";
}
