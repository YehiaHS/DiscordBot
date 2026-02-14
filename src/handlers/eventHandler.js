/**
 * Event handler — loads all event files from src/events/
 */
const fs = require("fs");
const path = require("path");

/**
 * Load all event files from the events directory.
 * @param {import("discord.js").Client} client
 */
function loadEvents(client) {
    const eventsDir = path.join(__dirname, "..", "events");
    const eventFiles = fs.readdirSync(eventsDir).filter((f) => f.endsWith(".js"));

    let count = 0;
    for (const file of eventFiles) {
        const event = require(path.join(eventsDir, file));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        count++;
    }

    console.log(`✡️ Loaded ${count} events.`);
}

module.exports = { loadEvents };
