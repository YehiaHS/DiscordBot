/**
 * GuildMemberRemove event — sends themed goodbye messages.
 */
const { getSetting } = require("../utils/database");
const { getGoodbyeMessage } = require("../utils/jewishFlavor");
const { createEmbed, COLORS } = require("../utils/embedBuilder");

const { handleMemberLeave } = require("../features/moderationLogs");

module.exports = {
    name: "guildMemberRemove",
    once: false,
    async execute(member) {
        await handleMemberLeave(member);
        const channelId = getSetting(member.guild.id, "welcome_channel");
        if (!channelId) return;

        const channel = member.guild.channels.cache.get(channelId);
        if (!channel) return;

        const embed = createEmbed({
            title: "Member Left 😢",
            description: getGoodbyeMessage(`**${member.user.username}**`),
            color: COLORS.ERROR,
            thumbnail: member.user.displayAvatarURL({ size: 256 }),
        });

        channel.send({ embeds: [embed] }).catch(() => { });
    },
};
