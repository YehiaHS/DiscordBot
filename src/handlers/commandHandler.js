/**
 * Command handler — recursively loads all slash command files from src/commands/
 */
const fs = require("fs");
const path = require("path");

/**
 * Load all command files from the commands directory.
 * @param {import("discord.js").Client} client
 */
function loadCommands(client) {
    const commandsDir = path.join(__dirname, "..", "commands");
    const categories = fs.readdirSync(commandsDir).filter((f) =>
        fs.statSync(path.join(commandsDir, f)).isDirectory()
    );

    let count = 0;
    for (const category of categories) {
        const categoryDir = path.join(commandsDir, category);
        const commandFiles = fs.readdirSync(categoryDir).filter((f) => f.endsWith(".js"));

        for (const file of commandFiles) {
            const command = require(path.join(categoryDir, file));
            if (command.data && command.execute) {
                command.category = category; // Attach category for permission checks
                client.commands.set(command.data.name, command);
                count++;
            } else {
                console.warn(`⚠️ Command ${file} is missing 'data' or 'execute' export.`);
            }
        }
    }

    console.log(`✡️ Loaded ${count} commands across ${categories.length} categories.`);
}

module.exports = { loadCommands };
