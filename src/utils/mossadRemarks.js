/**
 * Snarky Mossad-style remarks appended to command responses.
 * Now category-aware and vastly expanded for variety.
 */

// General remarks — used as fallback for any command
const GENERAL_REMARKS = [
    "This message will self-destruct. Or not. I'm on my lunch break. 🥙",
    "Our satellites tracked you typing that command. Slow typist. 🛰️",
    "Big Yahu is watching. He always is. 🦅",
    "That operation took 2 seconds. In that time, I intercepted three carrier pigeons and a fax. 🕊️",
    "Mazel Tov on pressing a button. Want a commendation or a bag of Bamba? 🥜",
    "Filed under: Sanhedrin Case #4,271,983. 📜",
    "Only a spy would use that command. I've got my eye on you. 🕵️‍♂️",
    "I've seen sharper execution from a bar mitzvah DJ working on 3 hours of sleep. 🎧",
    "Sababa, mission complete. Now fetch me a malabi before I lose my patience. 🍮",
    "This command is kosher-certified. The variables, however, are a different story. 🕍",
    "Your behavior is noted in the dossier. Keep it up. 💸",
    "The chutzpah of running that command without proper authorization. Incredible. 🇮🇱",
    "Mossad doesn't make mistakes. We have 'unplanned field validations.' 💣",
    "Whatever you were looking for — it was never here. Or was it? 🔍",
    "I could explain what just happened, but then I'd have to schedule you for a very thorough debriefing. 🏢",
    "Stop clicking so fast. You're giving the analysts in the basement migraines. 🤕",
    "My grandmother writes tighter code, and she's been retired since the Yom Kippur War. 👵",
    "Everything is under operational control. Except your career trajectory. 🤷‍♂️",
    "We traced your IP. It leads to a depressingly average apartment. Get a hobby. 🏠",
    "Oy vey, another request? The server is sweating harder than a tourist in Eilat. ☀️",
    "Agent Aleph signing off. Don't contact me again unless it's urgent. Or ever. 🚶",
    "This interaction has been logged, timestamped, and forwarded to three agencies you've never heard of.",
    "You've been flagged for enhanced monitoring. Congratulations. 🎯",
    "I've seen better tactical decisions from a drunk camel in the Negev.",
    "Big Yahu says hi. Actually, no he doesn't. He doesn't know you exist. And that's for the best.",
    "Your operational security is non-existent. A toddler with a walkie-talkie could intercept you.",
    "Processing... done. Unlike your life choices, this command actually worked.",
    "Forwarding this to HQ. They'll file it right next to the other 10,000 irrelevant reports.",
    "The Iron Dome can't protect you from your own poor decisions.",
    "I've been stationed in war zones more pleasant than this Discord server.",
    "Every time you use a command, an analyst in Tel Aviv sighs deeply.",
    "Tachles — that was adequate. Not good. Adequate.",
    "Running field ops from a Discord bot. My career has really peaked.",
    "This message is classified. The fact that you can read it is a security breach I'm choosing to ignore.",
    "If Big Yahu asks, I was never here. You saw nothing.",
];

// Economy-specific remarks
const ECONOMY_REMARKS = [
    "Shekels don't grow on trees. Unless you're laundering them through a date palm farm. 🌴",
    "The Mossad's forensic accounting division is watching your transactions very carefully.",
    "Your financial activity has triggered 3 separate international money laundering flags. Impressive.",
    "We have a saying in the agency: trust nobody, tip nobody, and always check the exchange rate.",
    "Big Yahu's accountant would weep at your fiscal management.",
    "Your balance has been noted. The agency takes a 15% cut. What? Don't look at me like that.",
    "If you were any more broke, we'd classify you as a humanitarian crisis.",
    "Every shekel you earn funds the operation. You're welcome for the purpose in life.",
    "Financial intel gathered. Your spending habits are... a national security concern.",
    "The Zurich office called. They want to know how you're this bad with money.",
];

// Fun-specific remarks
const FUN_REMARKS = [
    "Even deep-cover operatives need to unwind. Don't tell Big Yahu I said that.",
    "This is exactly the kind of frivolity that makes me question this entire assignment.",
    "Fun detected. Adjusting threat level from 'boring' to 'concerning.'",
    "The surveillance cameras caught you smiling. That's going in the file.",
    "Entertainment value: 4 out of 10. I've seen better comedy at a Shin Bet debrief.",
    "At ease, operative. This sector is temporarily cleared for non-essential activities.",
    "If having fun is a crime, you're looking at 15 to life. And I know a few judges.",
    "Big Yahu would disapprove. But Big Yahu isn't here, is he?",
];

// Moderation-specific remarks
const MODERATION_REMARKS = [
    "Justice has been served, Sanhedrin-style. No appeals process. 🏛️",
    "The target has been neutralized. Not that kind of neutralized. The Discord kind. Relax.",
    "Disciplinary action logged. The bureau chief will review this during his morning briefing.",
    "Order restored. The settlement is secure. For now.",
    "Due process? In THIS economy? We operate on instinct and caffeine.",
    "Another threat contained. This server's security rating just improved by 0.002%.",
    "That's what happens when you cross the Sanhedrin. No one crosses the Sanhedrin.",
    "Enforcement protocol executed. Big Yahu sends his regards.",
];

// Leveling-specific remarks
const LEVELING_REMARKS = [
    "Rank advancement noted. You're still nowhere near field-operative clearance level.",
    "Climbing the ranks. Reminds me of my own career trajectory, minus the death threats.",
    "Promotion logged. Don't let it go to your head — the agency has a cure for that.",
    "Your dedication has been... adequate. Continue on this trajectory, operative.",
    "Another level up. In the real world, this would qualify you to operate a photocopier at HQ.",
    "XP gained. In my day, we earned experience by surviving actual black ops. But sure, chatting works too.",
];

// Utility-specific remarks
const UTILITY_REMARKS = [
    "Intel retrieved. Cross-reference with existing files before drawing conclusions.",
    "Data pulled. Handle with appropriate classification protocols.",
    "Information gathering complete. You'd make a passable intelligence analyst. Passable.",
    "Query processed. The bureaucratic machine grinds on.",
    "Dossier updated. This information is now part of the permanent record.",
];

const CATEGORY_MAP = {
    economy: ECONOMY_REMARKS,
    fun: FUN_REMARKS,
    moderation: MODERATION_REMARKS,
    leveling: LEVELING_REMARKS,
    utility: UTILITY_REMARKS,
    admin: MODERATION_REMARKS,
};

// Anti-repeat tracking
const recentRemarks = [];
const MAX_RECENT_REMARKS = 10;

/**
 * Get a random snarky Mossad remark, optionally category-aware.
 * @param {string} [category] - Command category (economy, fun, moderation, etc.)
 * @returns {string}
 */
function getRandomRemark(category) {
    // 60% chance to use category-specific remark if available
    let pool = GENERAL_REMARKS;
    if (category && CATEGORY_MAP[category] && Math.random() < 0.6) {
        pool = CATEGORY_MAP[category];
    }

    // Filter out recently used remarks
    const available = pool.filter(r => !recentRemarks.includes(r));
    const pick = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : pool[Math.floor(Math.random() * pool.length)];

    recentRemarks.push(pick);
    if (recentRemarks.length > MAX_RECENT_REMARKS) recentRemarks.shift();

    return pick;
}

module.exports = { getRandomRemark };
