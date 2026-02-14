/**
 * Deploy slash commands to Discord API.
 * Run with: npm run deploy
 */
require("dotenv").config();

const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
    console.error("❌ Missing DISCORD_TOKEN or CLIENT_ID in .env");
    process.exit(1);
}

const commands = [];
const commandsDir = path.join(__dirname, "..", "src", "commands");
const categories = fs.readdirSync(commandsDir).filter((f) =>
    fs.statSync(path.join(commandsDir, f)).isDirectory()
);

for (const category of categories) {
    const categoryDir = path.join(commandsDir, category);
    const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith(".js"));
    for (const file of files) {
        const command = require(path.join(categoryDir, file));
        if (command.data) {
            commands.push(command.data.toJSON());
        }
    }
}

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
    try {
        console.log(`✡️ Deploying ${commands.length} slash commands...`);

        if (GUILD_ID) {
            // Guild-specific (instant, good for testing)
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
            console.log(`✡️ Successfully registered ${commands.length} guild commands.`);
        } else {
            // Global (takes up to 1 hour to propagate)
            await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
            console.log(`✡️ Successfully registered ${commands.length} global commands.`);
        }
    } catch (error) {
        console.error("❌ Failed to deploy commands:", error);
    }
})();
