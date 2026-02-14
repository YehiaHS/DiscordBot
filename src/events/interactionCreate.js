/**
 * InteractionCreate event — routes slash commands to their handlers.
 */
const { errorEmbed } = require("../utils/embedBuilder");

module.exports = {
    name: "interactionCreate",
    once: false,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            await interaction.reply({
                embeds: [errorEmbed("Command Not Found", "Oy vey! This command doesn't exist. Try `/help`.")],
                ephemeral: true,
            });
            return;
        }

        // Permission Check for Moderation Commands
        if (command.category === "moderation") {
            const hasPower = interaction.member.permissions.has("Administrator") ||
                interaction.member.roles.cache.some(r => ["Mossad", "White ppl with power", "Moderator"].includes(r.name));

            if (!hasPower) {
                return interaction.reply({
                    embeds: [errorEmbed("Restricted Access 🔐", "You lack the clearance for this operation. Local Mossad agents have been notified of your chutzpah.")],
                    ephemeral: true
                });
            }
        }

        try {
            // Helper to hijack the reply and add the remark
            const originalReply = interaction.reply.bind(interaction);
            const originalFollowUp = interaction.followUp.bind(interaction);
            const { getRandomRemark } = require("../utils/mossadRemarks");

            interaction.reply = async (options) => {
                const remark = getRandomRemark();
                if (typeof options === 'string') options = { content: options };
                if (options.embeds) {
                    options.content = options.content ? `${options.content}\n\n*${remark}*` : `*${remark}*`;
                } else if (!options.content) {
                    options.content = `*${remark}*`;
                } else {
                    options.content += `\n\n*${remark}*`;
                }
                return originalReply(options);
            };

            interaction.followUp = async (options) => {
                const remark = getRandomRemark();
                if (typeof options === 'string') options = { content: options };
                if (options.content) options.content += `\n\n*${remark}*`;
                else options.content = `*${remark}*`;
                return originalFollowUp(options);
            };

            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing /${interaction.commandName}:`, error);
            const reply = {
                embeds: [errorEmbed("Error!", "Something went wrong! Even the Mossad couldn't figure this one out. 💀")],
                ephemeral: true,
            };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }

    },
};
