/**
 * Jewbot — Main entry point
 * The ultimate Jewish-themed Discord bot.
 */
require("dotenv").config();

const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");
const { loadCommands } = require("./handlers/commandHandler");
const { loadEvents } = require("./handlers/eventHandler");
const { initDatabase } = require("./utils/database");
const { startMossadAgent } = require("./features/mossadAgent");

// Validate token exists
if (!process.env.DISCORD_TOKEN) {
    console.error("❌ Missing DISCORD_TOKEN in .env file. Copy .env.example to .env and fill in your token.");
    process.exit(1);
}

// Create client with all necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
});

// Attach commands collection to client
client.commands = new Collection();

// Initialize everything
console.log("✡️ Initializing Jewbot...");
initDatabase();
loadCommands(client);
loadEvents(client);
startMossadAgent(client);

// Login
client.login(process.env.DISCORD_TOKEN);

// Graceful shutdown
process.on("SIGINT", () => {
    console.log("✡️ Jewbot shutting down... Shabbat Shalom!");
    client.destroy();
    process.exit(0);
});

process.on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection:", error);
});
