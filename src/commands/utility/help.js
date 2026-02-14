/**
 * /help — Lists all commands organized by category.
 */
const { SlashCommandBuilder } = require("discord.js");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

const CATEGORIES = {
    moderation: { name: "⚖️ Moderation", description: "Keep order in the Promised Land" },
    economy: { name: "💰 Economy (Shekels)", description: "Earn, spend, and gamble your shekels" },
    leveling: { name: "📊 Leveling", description: "Climb the ranks of the chosen" },
    fun: { name: "😂 Fun", description: "Entertainment, Jewish-style" },
    utility: { name: "🔧 Utility", description: "Useful tools for the tribe" },
    admin: { name: "⚙️ Admin", description: "Server configuration" },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("View all commands — the Torah of Jewbot 📖")
        .addStringOption((o) =>
            o.setName("category").setDescription("Filter by category")
                .addChoices(
                    { name: "Moderation", value: "moderation" },
                    { name: "Economy", value: "economy" },
                    { name: "Leveling", value: "leveling" },
                    { name: "Fun", value: "fun" },
                    { name: "Utility", value: "utility" },
                    { name: "Admin", value: "admin" },
                )
        ),

    async execute(interaction) {
        const filter = interaction.options.getString("category");
        const commands = interaction.client.commands;

        if (filter) {
            const cat = CATEGORIES[filter];
            const cmds = commands.filter((c) => {
                const filePath = require.resolve(`./../${filter}/${c.data.name}`).toLowerCase();
                return filePath.includes(`\\${filter}\\`) || filePath.includes(`/${filter}/`);
            });

            // Fallback: just get commands whose files are in that category
            const categoryCommands = [];
            const fs = require("fs");
            const path = require("path");
            const catDir = path.join(__dirname, "..", filter);
            if (fs.existsSync(catDir)) {
                const files = fs.readdirSync(catDir).filter((f) => f.endsWith(".js"));
                for (const file of files) {
                    const name = file.replace(".js", "");
                    const cmd = commands.get(name);
                    if (cmd) categoryCommands.push(cmd);
                }
            }

            const cmdList = categoryCommands.map((c) =>
                `\`/${c.data.name}\` — ${c.data.description}`
            ).join("\n");

            return interaction.reply({
                embeds: [createEmbed({
                    title: `Help — ${cat.name}`,
                    description: `${cat.description}\n\n${cmdList || "No commands found."}`,
                    color: COLORS.INFO,
                })],
                ephemeral: true,
            });
        }

        // Show all categories
        const fields = Object.entries(CATEGORIES).map(([key, cat]) => {
            const fs = require("fs");
            const path = require("path");
            const catDir = path.join(__dirname, "..", key);
            let count = 0;
            if (fs.existsSync(catDir)) {
                count = fs.readdirSync(catDir).filter((f) => f.endsWith(".js")).length;
            }
            return {
                name: cat.name,
                value: `${cat.description}\n*${count} commands* — \`/help category:${key}\``,
                inline: true,
            };
        });

        return interaction.reply({
            embeds: [createEmbed({
                title: "The Torah of Jewbot 📖",
                description: "All commands at your fingertips. Use `/help category:<name>` for details.\n\n*Every command is infused with Jewish humor and Israeli chutzpah!*",
                color: COLORS.INFO,
                fields,
            })],
            ephemeral: true,
        });
    },
};
