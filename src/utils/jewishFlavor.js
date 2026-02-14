/**
 * Jewish/Israel-themed flavor text used across all bot responses.
 * Centralizes all humor so it's easy to expand and maintain.
 */

/** Random embed footer quips — appended to every themed embed */
const FOOTER_QUIPS = [
  "✡️ Powered by chutzpah and cholent",
  "✡️ Sponsored by your Jewish mother's guilt",
  "✡️ May your shekels multiply like the stars",
  "✡️ This message is kosher certified",
  "✡️ Oy vey, another command executed",
  "✡️ L'chaim! 🥂",
  "✡️ Made with love in Tel Aviv",
  "✡️ Iron Dome protects this server",
  "✡️ Brought to you by Sabra hummus",
  "✡️ Now with 613% more mitzvot",
  "✡️ Approved by the Sanhedrin",
  "✡️ Torah-compliant technology™",
  "✡️ Runs on falafel and Bamba",
  "✡️ Shabbat-mode not included",
  "✡️ May the schwartz be with you",
  "✡️ This bot has more features than a Bar Mitzvah DJ",
  "✡️ Generating responses at the speed of a Jewish mother texting",
  "✡️ 40 years to deliver this message",
  "✡️ We wandered through 40 servers to find this one",
  "✡️ Warning: may cause sudden urge to eat rugelach",
  "✡️ IDF-grade encryption (not really)",
  "✡️ Next year in Jerusalem!",
  "✡️ Moshe Rabbeinu approved ✓",
  "✡️ Error 404: Bacon not found",
  "✡️ More reliable than Israeli bus schedules",
  "✡️ Kibbutz-built, worldwide loved",
  "✡️ If this bot were any more Jewish, it'd argue with itself",
  "✡️ Disclaimer: No camels were harmed",
  "✡️ Mazel tov on using this command!",
  "✡️ Do not operate on Shabbat (just kidding, I'm a bot)",
];

/** Status messages the bot rotates through */
const STATUS_MESSAGES = [
  "Guarding the server like the IDF",
  "Counting shekels 💰",
  "Studying the Torah of Discord",
  "Making aliyah to your DMs",
  "Spinning the dreidel 🎶",
  "Serving hummus and justice",
  "Building settlements in voice chat",
  "Negotiating peace deals",
  "Davening for more server members",
  "Running a falafel stand",
  "Protecting this server with Iron Dome",
  "Arguing with other bots (it's a tradition)",
];

/** 8-ball / Jewball responses */
const JEWBALL_RESPONSES = [
  { text: "The Rabbi says yes.", positive: true },
  { text: "Absolutely, mazel tov!", positive: true },
  { text: "The Torah permits it.", positive: true },
  { text: "Hashem wills it so.", positive: true },
  { text: "As certain as the sun rising over Jerusalem.", positive: true },
  { text: "Even your bubbe would approve.", positive: true },
  { text: "The Mossad has confirmed it.", positive: true },
  { text: "L'chaim! That's a yes!", positive: true },
  { text: "The Dead Sea Scrolls predicted this. Yes.", positive: true },
  { text: "Yes, but don't tell your mother.", positive: true },
  { text: "Ask your mother.", neutral: true },
  { text: "Let me consult the Talmud... try again later.", neutral: true },
  { text: "The Kabbalistic signs are unclear.", neutral: true },
  { text: "Even King Solomon couldn't decide this one.", neutral: true },
  { text: "Ask again after Shabbat.", neutral: true },
  { text: "The Western Wall is thinking about it...", neutral: true },
  { text: "Not on Shabbat.", negative: true },
  { text: "The Rabbi says no. Also, call your mother.", negative: true },
  { text: "Oy vey, definitely not.", negative: true },
  { text: "The Mossad says no, and stop asking.", negative: true },
  { text: "Not even if Moses himself asked.", negative: true },
  { text: "Absolutely not. This is treif.", negative: true },
  { text: "My bubbe is rolling in her grave at this question. No.", negative: true },
  { text: "The Sanhedrin has voted: denied.", negative: true },
  { text: "Not kosher. Hard no.", negative: true },
  { text: "Forbidden by the 614th commandment.", negative: true },
];

/** Roast templates — {user} gets replaced with the target's display name */
const ROASTS = [
  "{user} is the reason Moses needed 40 years — he was trying to get away from people like you.",
  "{user} has less culture than a petri dish in the Negev desert.",
  "{user} is so boring, even a 3-hour Seder feels exciting by comparison.",
  "{user} couldn't negotiate a discount at the shuk if their life depended on it.",
  "{user} is the human equivalent of gefilte fish — nobody asked for you, but here you are.",
  "{user}'s IQ is lower than the Dead Sea.",
  "{user} is proof that not all of God's chosen people are chosen equally.",
  "{user} brings the same energy as the last day of Hanukkah — technically still going, but nobody cares.",
  "{user} is the reason we have the Wailing Wall.",
  "{user} is so cheap, they'd charge Moses for splitting the Red Sea.",
  "{user} has the charisma of a matzah cracker — dry, flat, and hard to swallow.",
  "{user} is like hamantaschen with no filling — disappointing inside.",
  "{user} couldn't get a date even if they were a fig on a Tu B'Shvat tree.",
  "{user} is the 11th plague that didn't make the cut.",
  "{user} makes Pharaoh look like a reasonable person.",
  "{user} is what happens when you open the door for Elijah and the wrong person walks in.",
];

/** Random Jewish jokes (setup + punchline) */
const JOKES = [
  { setup: "Why don't Jewish mothers drink?", punchline: "Alcohol interferes with their suffering." },
  { setup: "What's the difference between a Jewish mother and a GPS?", punchline: "A GPS eventually stops telling you where to go." },
  { setup: "Why did the matzah go to the doctor?", punchline: "Because it was feeling crummy." },
  { setup: "What do you call a Jewish knight?", punchline: "Sir Cumcision." },
  { setup: "Why do Jewish men get circumcised?", punchline: "Because Jewish women won't touch anything that isn't at least 10% off." },
  { setup: "How does Moses make his coffee?", punchline: "Hebrews it. ☕" },
  { setup: "What did the Jewish mother say when her son became an astronaut?", punchline: "\"You couldn't be a doctor up THERE either?\"" },
  { setup: "Why did Adam and Eve move to Israel?", punchline: "They wanted to start fresh in the Promised Land." },
  { setup: "What's a Jewish dilemma?", punchline: "Free ham." },
  { setup: "Why don't Jews eat at the Last Supper?", punchline: "Because they already ate at the first one." },
  { setup: "What do you call a potato that has converted to Judaism?", punchline: "A Hebrewed Spud." },
  { setup: "Why was the Red Sea so stressed?", punchline: "Because Moses kept splitting on it." },
  { setup: "What do you call cheese that isn't yours in Israel?", punchline: "Nacho cheese — it's THE cheese." },
  { setup: "Why did the Jewish boy fail his driving test?", punchline: "He kept trying to negotiate the right of way." },
  { setup: "What's the most popular pick-up line in Israel?", punchline: "\"Is your father a terrorist? Because you're the bomb.\" (Too edgy? The IDF says it's fine.)" },
];

/** Random Israel/Judaism facts */
const FACTS = [
  "Israel is the only country in the world that has more trees now than it had 50 years ago. 🌳",
  "The Dead Sea is the lowest point on Earth at 430.5 meters below sea level.",
  "Israel has the highest number of startups per capita in the world — they call it the 'Startup Nation'.",
  "Hebrew was a dead language for 1,700 years before it was revived in the late 19th century.",
  "Israel is roughly the size of New Jersey, but packs 9 million people and 10 million opinions.",
  "The word 'chutzpah' means audacity or nerve — and Israelis have it in unlimited supply.",
  "Drip irrigation was invented in Israel, saving water and feeding the world.",
  "Tel Aviv has more sushi restaurants per capita than Tokyo. Yes, really.",
  "The Bible mentions Israel over 2,500 times. It's basically a recurring character.",
  "Jews make up 0.2% of the world's population but have won 22% of all Nobel Prizes.",
  "The Technion in Haifa is older than the State of Israel — founded in 1912.",
  "Israel is the only democracy in the Middle East. Fight me. (Actually, don't.)",
  "Bamba, the peanut butter puff snack, is Israel's best-selling snack and has been linked to lower peanut allergies in Israeli kids.",
  "The Western Wall in Jerusalem is roughly 2,000 years old and still has better structural integrity than most 2-year-old buildings.",
  "Waze, the GPS app, was invented in Israel. And yet, Israeli drivers still can't navigate a roundabout.",
  "Israel has the most museums per capita of any country in the world.",
  "The kibbutz movement is one of the only successful communal living experiments in modern history.",
  "Krav Maga, the martial art used by military forces worldwide, was developed in Israel.",
  "Cherry tomatoes were developed by Israeli scientists. You're welcome, salads of the world.",
  "USB flash drives were invented in Israel by the company M-Systems.",
];

/** Work job descriptions for the economy system */
const WORK_JOBS = [
  { job: "sold falafel at the shuk", min: 50, max: 200 },
  { job: "tutored a Bar Mitzvah boy his Torah portion", min: 100, max: 300 },
  { job: "drove a sherut taxi through Tel Aviv traffic", min: 40, max: 150 },
  { job: "worked a shift at the Dead Sea cosmetics kiosk", min: 60, max: 250 },
  { job: "served hummus at Abu Hassan's", min: 30, max: 120 },
  { job: "haggled at the Carmel Market", min: 80, max: 350 },
  { job: "performed stand-up comedy in Hebrew", min: 20, max: 400 },
  { job: "guarded a settlement", min: 100, max: 200 },
  { job: "developed an app in the Startup Nation", min: 200, max: 500 },
  { job: "organized a Birthright trip", min: 70, max: 180 },
  { job: "ran a bagel delivery service in Brooklyn", min: 50, max: 150 },
  { job: "taught Hebrew on Duolingo", min: 30, max: 100 },
  { job: "sold Judaica on Etsy", min: 60, max: 250 },
  { job: "worked as a lifeguard at the Dead Sea (easiest job ever)", min: 40, max: 120 },
  { job: "catered a bris (don't ask about the tips)", min: 80, max: 300 },
  { job: "fixed someone's website for 'exposure' and a plate of rugelach", min: 10, max: 80 },
  { job: "wrote Torah commentary blog posts", min: 25, max: 110 },
  { job: "DJ'd a Jewish wedding for 6 hours straight", min: 150, max: 450 },
  { job: "sold Iron Dome merch online", min: 70, max: 220 },
  { job: "gave tours of the Western Wall", min: 50, max: 160 },
];

/** Random Hebrew words for the `/hebrew` command */
const HEBREW_WORDS = [
  { word: "סבבה", transliteration: "Sababa", meaning: "Cool / No problem / Everything's great" },
  { word: "יאללה", transliteration: "Yalla", meaning: "Let's go! / Come on! / Hurry up!" },
  { word: "חביבי", transliteration: "Habibi", meaning: "My dear / My friend (Arabic origin, used constantly in Israel)" },
  { word: "בלאגן", transliteration: "Balagan", meaning: "A mess / chaos / total disorder" },
  { word: "סתם", transliteration: "Stam", meaning: "Just kidding / for no reason / whatever" },
  { word: "אחלה", transliteration: "Achla", meaning: "Awesome / great / the best" },
  { word: "פרייר", transliteration: "Fraier", meaning: "A sucker / someone who gets taken advantage of (worst insult in Israel)" },
  { word: "דווקא", transliteration: "Davka", meaning: "Specifically / despite / out of spite" },
  { word: "חוצפה", transliteration: "Chutzpah", meaning: "Audacity / nerve / brazen boldness" },
  { word: "תכלס", transliteration: "Tachles", meaning: "Basically / bottom line / get to the point" },
  { word: "שווארמה", transliteration: "Shawarma", meaning: "The superior form of street food. End of discussion." },
  { word: "קיבוץ", transliteration: "Kibbutz", meaning: "Communal settlement — basically socialism that actually worked" },
  { word: "נחמד", transliteration: "Nechmad", meaning: "Nice / pleasant / lovely" },
  { word: "מגניב", transliteration: "Magniv", meaning: "Cool / awesome / literally 'thieving'" },
  { word: "סליחה", transliteration: "Slicha", meaning: "Excuse me / sorry (used 500 times daily in Israel)" },
];

/** Matchmaker compatibility descriptions */
const MATCHMAKER_RESULTS = [
  { min: 0, max: 10, desc: "The Yenta has spoken: this match is treif. 🚫 Not even a Jewish mother could make this work." },
  { min: 11, max: 25, desc: "As compatible as bacon and a kosher kitchen. 😬" },
  { min: 26, max: 40, desc: "Ehhh... maybe if you were the last two people at a singles' event in Boca Raton." },
  { min: 41, max: 55, desc: "It's giving 'second cousin at a family reunion' energy. Proceed with caution." },
  { min: 56, max: 70, desc: "Not bad! Your bubbes would cautiously approve. 👵" },
  { min: 71, max: 85, desc: "Mazel tov! This is a solid shidduch. The mothers are already planning the wedding." },
  { min: 86, max: 95, desc: "Bashert! Written in the stars and approved by the Almighty! 💫✡️" },
  { min: 96, max: 100, desc: "100% MATCH. This is the shidduch of the century. Start booking the hall immediately. 🎉🕎" },
];

/** Welcome messages */
const WELCOME_MESSAGES = [
  "**Shalom, {user}!** 🕎 You've officially made Aliyah to this server. Welcome to the Promised Land of Discord!",
  "**Baruch HaBa, {user}!** ✡️ Another soul has found their way to our kibbutz. Make yourself at home!",
  "**{user} has arrived!** The prophecy is fulfilled. Another member joins the tribe! 🎺",
  "**Mazel Tov!** {user} has been chosen... to join this server. L'chaim! 🥂",
  "**Alert: {user} has crossed the Red Sea** and made it to our server. Moshe would be proud. 🌊",
  "**{user} just showed up** like Elijah at the Seder — unexpected but always welcome! 🚪✡️",
];

/** Goodbye messages */
const GOODBYE_MESSAGES = [
  "**{user} has left the server.** Another one wanders into the desert... see you in 40 years. 🏜️",
  "**{user} has departed.** They've been exiled from the Promised Land. Pour one out. 😢",
  "**{user} is gone.** Even Pharaoh let people go eventually, but this one left voluntarily. 💀",
  "**{user} left.** The tribe has shrunk. Someone light a memorial candle. 🕯️",
  "**{user} bounced.** They couldn't handle the chutzpah. Shalom, friend. ✌️",
];

/** Meme captions */
const MEME_CAPTIONS = [
  "When someone says they don't like hummus:\n*angry Israeli noises* 😤",
  "My Jewish mother after I don't call for ONE day:\n\"So you've forgotten you have a mother?\"",
  "Nobody:\nIsraeli drivers: 🚗💨 *HONK HONK YALLA YALLA*",
  "Me trying to eat bread during Passover:\n👀 *looks around nervously*",
  "When the DJ at the Bar Mitzvah plays Hava Nagila for the 47th time:\n*pretends to be surprised*",
  "When someone asks if I want seconds at Shabbat dinner:\nBrother, I'm already on fourths.",
  "The Dead Sea:\n*exists*\nTourists: \"LeT mE fLoAt In It\" 🧂",
  "When your bubbe says \"you look thin\":\nI literally gained 10 pounds but okay 😭",
  "Israeli tech bros explaining their startup:\n\"It's like Uber, but for hummus delivery\"",
  "When you open the door for Elijah at Passover and your uncle walks in:\nDisappointed but not surprised",
  "Me after eating an entire challah by myself:\n*No regrets, only carbs* 🍞",
  "When someone mixes up Hanukkah and Christmas:\n*visible Jewish pain*",
  "Israelis in line at the airport:\nWhat line? We don't do lines. 🇮🇱",
  "Jewish moms when you say you're not hungry:\n\"EAT. YOU'RE SKIN AND BONES.\" *puts 3 plates in front of you*",
  "When someone asks what Yom Kippur is:\n\"It's like a 25-hour timeout for your stomach\"",
];

/** Leveling rank names */
const RANK_NAMES = [
  { level: 0, name: "Goy Curious", emoji: "🤔" },
  { level: 1, name: "Talmid", emoji: "📖" },
  { level: 5, name: "Bar/Bat Mitzvah", emoji: "🎉" },
  { level: 10, name: "Yeshiva Student", emoji: "📚" },
  { level: 15, name: "Chaver", emoji: "🤝" },
  { level: 20, name: "Shaliach", emoji: "✈️" },
  { level: 25, name: "Rav", emoji: "🙏" },
  { level: 30, name: "Rosh Yeshiva", emoji: "🎓" },
  { level: 40, name: "Chief Rabbi", emoji: "👑" },
  { level: 50, name: "Prophet", emoji: "⚡" },
  { level: 60, name: "Moses Tier", emoji: "🏔️" },
  { level: 75, name: "HaShem's Favorite", emoji: "✡️" },
];

/** Shop items for the economy */
const SHOP_ITEMS = [
  { id: "kippah", name: "Kippah", emoji: "🧢", price: 500, description: "The classic head covering. +10 drip." },
  { id: "menorah", name: "Golden Menorah", emoji: "🕎", price: 2000, description: "Flex your 8 crazy nights of wealth." },
  { id: "challah", name: "Challah Bread", emoji: "🍞", price: 100, description: "Shabbat-ready braided goodness." },
  { id: "dreidel_gold", name: "Golden Dreidel", emoji: "🪙", price: 5000, description: "+5% bonus on all gambles." },
  { id: "iron_dome", name: "Iron Dome VIP", emoji: "🛡️", price: 10000, description: "Protection from /rob attempts." },
  { id: "falafel_cart", name: "Falafel Cart", emoji: "🧆", price: 3000, description: "Passive income: +50 shekels/day." },
  { id: "dead_sea_mud", name: "Dead Sea Mud Mask", emoji: "💆", price: 750, description: "Anti-aging or anti-roast? Both." },
  { id: "star_of_david", name: "Star of David Chain", emoji: "✡️", price: 1500, description: "The bling of the chosen people." },
  { id: "sabra", name: "Sabra Status", emoji: "🌵", price: 8000, description: "Tough on the outside, sweet on the inside." },
  { id: "western_wall", name: "Western Wall Pass", emoji: "🧱", price: 15000, description: "Your prayers go straight to the top." },
];

// ----- Helper functions -----

/** Get a random item from an array */
function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Get a random footer quip */
function getFooterQuip() {
  return random(FOOTER_QUIPS);
}

/** Get a random status message */
function getStatusMessage() {
  return random(STATUS_MESSAGES);
}

/** Get a Jewball response */
function getJewballResponse() {
  return random(JEWBALL_RESPONSES);
}

/** Get a roast with the user's name inserted */
function getRoast(username) {
  return random(ROASTS).replace("{user}", username);
}

/** Get a random joke */
function getJoke() {
  return random(JOKES);
}

/** Get a random fact */
function getFact() {
  return random(FACTS);
}

/** Get a random work job */
function getWorkJob() {
  const job = random(WORK_JOBS);
  const earned = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
  return { job: job.job, earned };
}

/** Get a random Hebrew word */
function getHebrewWord() {
  return random(HEBREW_WORDS);
}

/** Get matchmaker result for a given percentage */
function getMatchmakerResult(percentage) {
  return MATCHMAKER_RESULTS.find((r) => percentage >= r.min && percentage <= r.max);
}

/** Get a welcome message */
function getWelcomeMessage(username) {
  return random(WELCOME_MESSAGES).replace("{user}", username);
}

/** Get a goodbye message */
function getGoodbyeMessage(username) {
  return random(GOODBYE_MESSAGES).replace("{user}", username);
}

/** Get a random meme caption */
function getMemeCatption() {
  return random(MEME_CAPTIONS);
}

/** Get rank name for a given level */
function getRankForLevel(level) {
  let rank = RANK_NAMES[0];
  for (const r of RANK_NAMES) {
    if (level >= r.level) rank = r;
  }
  return rank;
}

/** Get XP required for a given level */
function xpForLevel(level) {
  return 100 * level * level;
}

/** Get level from XP */
function levelFromXp(xp) {
  return Math.floor(Math.sqrt(xp / 100));
}

module.exports = {
  FOOTER_QUIPS, STATUS_MESSAGES, JEWBALL_RESPONSES, ROASTS, JOKES, FACTS,
  WORK_JOBS, HEBREW_WORDS, MATCHMAKER_RESULTS, WELCOME_MESSAGES,
  GOODBYE_MESSAGES, MEME_CAPTIONS, RANK_NAMES, SHOP_ITEMS,
  random, getFooterQuip, getStatusMessage, getJewballResponse,
  getRoast, getJoke, getFact, getWorkJob, getHebrewWord,
  getMatchmakerResult, getWelcomeMessage, getGoodbyeMessage,
  getMemeCatption, getRankForLevel, xpForLevel, levelFromXp,
};
