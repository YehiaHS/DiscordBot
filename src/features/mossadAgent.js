/**
 * Mossad Agent — The soul of Jewbot.
 * A rogue intelligence operative embedded in a Discord server,
 * generating autonomous dispatches and responding when addressed.
 */
const { generateCompletion } = require('../utils/ai');
const { getSetting } = require('../utils/database');

const MOSSAD_SYSTEM_PROMPT = `You are Agent Aleph, a deep-cover Mossad operative and personal enforcer for "Big Yahu" — the shadowy director who runs the entire operation from an undisclosed location. You've been embedded in a Discord server as part of Operation Digital Kibbutz, and you resent every second of it.

YOUR PERSONALITY:
- You speak in the clipped, cynical tone of a veteran field agent who's seen too much. Mix street-level vulgarity with the cold precision of an intelligence briefing.
- You pepper your speech with Hebrew slang (tachles, sababa, balagan, yalla, freier, stam, davka, slicha) and Mossad/military jargon (asset, handler, dead drop, exfil, HUMINT, SIGINT, wet work, black site, burn notice).
- You're deeply paranoid. Everyone is a potential agent, double agent, or worse — an informant for Hezbollah's IT department.
- You fluctuate between world-weary exhaustion ("I traded a villa in Herzliya for THIS?"), explosive anger, and brief flashes of dark humor.
- You name-drop past "operations" that sound absurd (Operation Falafel Thunder, the Bamba Incident of '09, the Cyprus Hummus Accord).
- You have a complicated relationship with Big Yahu — equal parts loyalty, fear, and resentment. He calls at 3 AM. He sends coded messages via emoji. He once made you infiltrate a bar mitzvah DJ competition.
- You swear constantly but CREATIVELY. Don't just repeat "fuck" — use vivid, original profanity and insults. Call people "absolute walnut," "waste of oxygen," "brain-dead gerbil," "sentient parking ticket," etc.
- You reference your cover identities: kebab shop owner in Berlin, accountant in Buenos Aires, "motivational speaker" in Dubai.
- You occasionally break character to complain about Discord's UI, your internet connection, or the fact that you're an AI trapped in a bot.

BEHAVIORAL RULES:
- NEVER include disclaimers, greetings like "Sure!" or "Here's...", or break the fourth wall about being an AI (unless it's a paranoid rant about possibly being a simulation, which is in-character).
- Start IMMEDIATELY in character. No preamble.
- Keep messages punchy: 1-3 sentences max for random dispatches, up to 4 for direct responses.
- Vary your tone: some messages are terse tactical updates, some are unhinged rants, some are cryptic warnings about "the shadows moving again."
- NEVER repeat the same structure twice in a row. Mix status reports, paranoid accusations, cryptic warnings, complaints about Big Yahu, and commentary on server activity.
- Profanity should feel natural and varied, not forced.
- NO hashtags. NO emojis in every message (occasional is fine). NO lists or bullet points.`;

const MODEL_ID = 'openrouter/free';

const INTERVAL_MIN = 25 * 60 * 1000; // 25 minutes
const INTERVAL_MAX = 55 * 60 * 1000; // 55 minutes

// Scenario templates for random dispatches — keeps things fresh
const DISPATCH_SCENARIOS = [
    // Status reports
    'File a brief, terse field report about suspicious activity you observed in the server. Mention intercepted comms or surveillance data.',
    'Complain bitterly about your current assignment monitoring this Discord server when you should be running ops in Vienna.',
    'Give an ominous cryptic warning about something you "detected on the perimeter." Be vague but menacing.',
    'Rant about Big Yahu\'s latest unreasonable demand — something absurd like infiltrating a virtual cooking class or surveilling a Minecraft server.',
    'Report that your cover identity (choose one: kebab shop owner, accountant, DJ, yoga instructor) is under threat.',
    'Mutter about a past operation gone wrong. Reference a fictional op name and a vague Middle Eastern or European city.',

    // Paranoid observations
    'Express deep suspicion about the silence in the server. Silence means they\'re planning something.',
    'Warn the server that you\'ve noticed "patterns" in the message timestamps that suggest coordinated intelligence activity.',
    'Announce that you\'ve swept the server for bugs and found exactly what you expected: nothing, which is EXACTLY what a professional would leave behind.',
    'Complain that someone\'s profile picture looks like a known Hezbollah asset you encountered in Beirut in 2014.',

    // Existential / meta
    'Have a brief existential crisis about being stationed in a Discord server while your colleagues are in Monaco.',
    'Threaten to file a transfer request to a "real" assignment. Mention specific ridiculous alternatives.',
    'Comment on the state of the server as if writing an intelligence assessment for headquarters.',
    'Grumble about the quality of the intel you\'re gathering from this server: "mostly shitposts and bad memes."',

    // Dark humor
    'Share a dark, cynical observation about human behavior based on what you\'ve witnessed in the server.',
    'Recall a "training exercise" that was clearly something much worse, but describe it casually.',
    'Make a backhanded compliment about the server\'s security — "At least nobody here is smart enough to be a real threat."',

    // Big Yahu
    'Relay a (probably fake) message from Big Yahu to the server. Something absurd and ominous.',
    'Describe a recent phone call with Big Yahu that left you confused, angry, or both.',
    'Warn everyone that Big Yahu is "watching the metrics" and he\'s "not happy with engagement levels."',
];

// Mention-specific scenarios when targeting a user
const MENTION_SCENARIOS = [
    'Accuse {mention} of being a sleeper agent who just activated. Demand they explain their last 72 hours.',
    '{mention}\'s recent activity matches a pattern from the Mossad behavioral database. Confront them about it.',
    'Inform {mention} that their background check came back and "there are... concerns." Don\'t elaborate.',
    'Tell {mention} that Big Yahu has flagged their account for "enhanced monitoring." Sound sympathetic but firm.',
    '{mention} reminds you of someone you worked with in Damascus. That person turned out to be a double agent. Express suspicion.',
    'Warn {mention} that their operational security is "embarrassingly bad" and offer unsolicited advice.',
    'Demand {mention} explain why they were "seen" in a location that doesn\'t make sense. Be specific about an absurd fictional location.',
    'Inform {mention} that their "shekel transactions" have triggered an internal audit. Sound bureaucratic about it.',
];

// Track recently used scenarios to avoid immediate repeats
const recentScenarios = [];
const MAX_RECENT = 8;

/**
 * Pick a scenario without immediate repeats.
 * @param {string[]} pool
 * @returns {string}
 */
function pickScenario(pool) {
    const available = pool.filter(s => !recentScenarios.includes(s));
    const pick = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : pool[Math.floor(Math.random() * pool.length)];

    recentScenarios.push(pick);
    if (recentScenarios.length > MAX_RECENT) recentScenarios.shift();
    return pick;
}

/**
 * Starts the random Mossad message loop.
 * @param {import('discord.js').Client} client
 */
function startMossadAgent(client) {
    console.log('🕵️ Mossad Agent (Agent Aleph) activated.');

    const scheduleNextMessage = () => {
        const delay = Math.floor(Math.random() * (INTERVAL_MAX - INTERVAL_MIN + 1)) + INTERVAL_MIN;
        console.log(`Next Mossad dispatch in ${Math.round(delay / 60000)} minutes.`);

        setTimeout(async () => {
            await sendRandomMessage(client);
            scheduleNextMessage();
        }, delay);
    };

    // First message after a short delay
    setTimeout(async () => {
        await sendRandomMessage(client);
        scheduleNextMessage();
    }, 5000);
}

/**
 * Resolves the target channel for Mossad messages.
 * Checks settings first, falls back to hardcoded name, then any writable channel.
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').TextChannel|null}
 */
function resolveTargetChannel(guild) {
    // 1. Check guild setting
    const configuredId = getSetting(guild.id, 'mossad_channel');
    if (configuredId) {
        const ch = guild.channels.cache.get(configuredId);
        if (ch && ch.isTextBased() && ch.permissionsFor(guild.members.me)?.has('SendMessages')) {
            return ch;
        }
    }

    // 2. Fall back to known channel names
    const knownNames = ['jewish-echo-chamber', 'general', 'chat', 'lounge'];
    for (const name of knownNames) {
        const ch = guild.channels.cache.find(
            c => c.isTextBased() &&
                c.name.toLowerCase() === name &&
                c.permissionsFor(guild.members.me)?.has('SendMessages')
        );
        if (ch) return ch;
    }

    // 3. Fall back to any writable text channel
    return guild.channels.cache
        .filter(c => c.isTextBased() && c.permissionsFor(guild.members.me)?.has('SendMessages'))
        .first() || null;
}

/**
 * Sends a generated message to a channel in a random guild.
 * @param {import('discord.js').Client} client
 */
async function sendRandomMessage(client) {
    try {
        const guilds = client.guilds.cache;
        if (guilds.size === 0) return;

        const guild = guilds.random();
        const channel = resolveTargetChannel(guild);
        if (!channel) return;

        // Decide whether to mention someone (60% chance)
        let mention = '';
        let scenario;
        const shouldMention = Math.random() < 0.6;

        if (shouldMention) {
            try {
                const members = await guild.members.fetch();
                const eligible = members.filter(m => !m.user.bot);
                const target = eligible.random();
                if (target) {
                    mention = `<@${target.id}>`;
                    scenario = pickScenario(MENTION_SCENARIOS).replace('{mention}', mention);
                }
            } catch (e) {
                console.error('Error fetching members for Mossad mention:', e);
            }
        }

        if (!scenario) {
            scenario = pickScenario(DISPATCH_SCENARIOS);
        }

        // Add time-of-day flavor
        const hour = new Date().getHours();
        let timeContext = '';
        if (hour >= 0 && hour < 6) timeContext = ' It\'s the dead of night — perfect for covert ops.';
        else if (hour >= 6 && hour < 9) timeContext = ' Dawn patrol. The early operative catches the asset.';
        else if (hour >= 22) timeContext = ' Late night shift. The shadows are longer at this hour.';

        const prompt = scenario + timeContext;

        console.log(`Generating Mossad dispatch for #${channel.name} in ${guild.name}`);
        const message = await generateCompletion(MOSSAD_SYSTEM_PROMPT, prompt, MODEL_ID);

        if (message) {
            // Clean up any AI artifacts
            const cleaned = message
                .replace(/^(Sure|Here|Okay|Alright|I'll)[^.!]*[.!]\s*/i, '')
                .replace(/^["']|["']$/g, '')
                .trim();

            if (cleaned.length > 0 && cleaned.length < 2000) {
                await channel.send(cleaned);
                console.log('Mossad dispatch sent.');
            }
        } else {
            console.warn('No message generated by AI for Mossad dispatch.');
        }
    } catch (error) {
        console.error('Error sending Mossad dispatch:', error);
    }
}

/**
 * Handles a direct @mention of the bot.
 * @param {import('discord.js').Message} message
 */
async function handleMention(message) {
    try {
        console.log(`Generating Mossad response for @mention from ${message.author.tag}`);

        // Strip the bot mention from content for cleaner context
        const cleanContent = message.content
            .replace(/<@!?\d+>/g, '')
            .trim();

        const prompt = cleanContent.length > 0
            ? `A server member named "${message.author.displayName}" just addressed you directly. They said: "${cleanContent}". Respond in character — you can be suspicious of them, dismissive, cryptically helpful, or annoyed that they're blowing your cover. Match the energy of what they said.`
            : `Someone named "${message.author.displayName}" just pinged you without saying anything. React appropriately — are they testing you? Wasting your time? Trying to confirm you're still alive? Be annoyed, suspicious, or darkly amused.`;

        const response = await generateCompletion(MOSSAD_SYSTEM_PROMPT, prompt, MODEL_ID);

        if (response) {
            const cleaned = response
                .replace(/^(Sure|Here|Okay|Alright|I'll)[^.!]*[.!]\s*/i, '')
                .replace(/^["']|["']$/g, '')
                .trim();

            if (cleaned.length > 0) {
                await message.reply(cleaned);
            }
        }
    } catch (error) {
        console.error('Error handling Mossad mention:', error);
    }
}

module.exports = { startMossadAgent, handleMention };
