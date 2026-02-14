/**
 * InteractionCreate event — routes slash commands to their handlers.
 * Appends category-aware Mossad remarks to every response.
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
            const { getRandomRemark } = require("../utils/mossadRemarks");
            const category = command.category || null;

            // Wrap reply to append a remark
            const originalReply = interaction.reply.bind(interaction);
            const originalFollowUp = interaction.followUp.bind(interaction);
            const originalEditReply = interaction.editReply.bind(interaction);

            interaction.reply = async (options) => {
                return originalReply(appendRemark(options, category));
            };

            interaction.followUp = async (options) => {
                return originalFollowUp(appendRemark(options, category));
            };

            interaction.editReply = async (options) => {
                return originalEditReply(appendRemark(options, category));
            };

            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing /${interaction.commandName}:`, error);
            const reply = {
                embeds: [errorEmbed("Error!", "Something went wrong! Even the Mossad couldn't figure this one out. 💀")],
                ephemeral: true,
            };

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(reply);
                } else {
                    await interaction.reply(reply);
                }
            } catch (replyError) {
                console.error("Failed to send error reply:", replyError);
            }
        }
    },
};

/**
 * Appends a Mossad remark to a reply options object.
 * @param {object|string} options
 * @param {string|null} category
 * @returns {object}
 */
function appendRemark(options, category) {
    const { getRandomRemark } = require("../utils/mossadRemarks");
    const remark = getRandomRemark(category);

    if (typeof options === 'string') {
        options = { content: options };
    }

    // Don't append to ephemeral error messages
    if (options.ephemeral) return options;

    if (options.embeds && options.embeds.length > 0) {
        options.content = options.content ? `${options.content}\n\n*${remark}*` : `*${remark}*`;
    } else if (!options.content) {
        options.content = `*${remark}*`;
    } else {
        options.content += `\n\n*${remark}*`;
    }

    return options;
}
