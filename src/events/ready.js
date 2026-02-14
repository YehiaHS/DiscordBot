/**
 * Ready event — fires when the bot comes online.
 */
const { ActivityType } = require("discord.js");
const { getStatusMessage } = require("../utils/jewishFlavor");

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        console.log(`✡️ Jewbot is online! Logged in as ${client.user.tag}`);
        console.log(`✡️ Serving ${client.guilds.cache.size} servers with chutzpah!`);

        // Set initial status
        client.user.setActivity(getStatusMessage(), { type: ActivityType.Custom });

        // Rotate status every 30 seconds
        setInterval(() => {
            client.user.setActivity(getStatusMessage(), { type: ActivityType.Custom });
        }, 30_000);
    },
};
