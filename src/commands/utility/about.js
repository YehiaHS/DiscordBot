/**
 * /about — Bot info, credits, and stats.
 */
const { SlashCommandBuilder, version: djsVersion } = require("discord.js");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("about")
        .setDescription("Learn about Jewbot — the bot, the legend, the chutzpah 🕎"),

    async execute(interaction) {
        const client = interaction.client;
        const uptime = formatUptime(client.uptime);
        const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
        const totalGuilds = client.guilds.cache.size;
        const totalCommands = client.commands.size;

        const memUsage = process.memoryUsage();
        const memMB = (memUsage.heapUsed / 1024 / 1024).toFixed(1);

        return interaction.reply({
            embeds: [createEmbed({
                title: "About Jewbot 🕎",
                description: [
                    "*The ultimate Jewish-themed Discord bot — edgy, meme-y, and full of chutzpah.*",
                    "",
                    "Jewbot brings Israeli humor, Mossad paranoia, a full shekel economy, leveling, moderation, and a rogue AI agent to your server.",
                    "",
                    "**Created with love** from the Promised Land of code. ✡️",
                ].join("\n"),
                color: COLORS.PRIMARY,
                thumbnail: client.user.displayAvatarURL({ size: 256 }),
                fields: [
                    { name: "📊 Servers", value: `${totalGuilds}`, inline: true },
                    { name: "👥 Users", value: `${totalUsers.toLocaleString()}`, inline: true },
                    { name: "⚡ Commands", value: `${totalCommands}`, inline: true },
                    { name: "⏱️ Uptime", value: uptime, inline: true },
                    { name: "💾 Memory", value: `${memMB} MB`, inline: true },
                    { name: "📦 discord.js", value: `v${djsVersion}`, inline: true },
                    { name: "🔗 Links", value: "[GitHub](https://github.com/Starttoaster/jewbot)", inline: false },
                ],
            })],
        });
    },
};

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m ${seconds % 60}s`;
}
