/**
 * GuildMemberAdd event — sends themed welcome messages.
 */
const { getSetting } = require("../utils/database");
const { getWelcomeMessage } = require("../utils/jewishFlavor");
const { createEmbed, COLORS } = require("../utils/embedBuilder");

const { handleMemberJoin } = require("../features/moderationLogs");

module.exports = {
    name: "guildMemberAdd",
    once: false,
    async execute(member) {
        await handleMemberJoin(member);
        const channelId = getSetting(member.guild.id, "welcome_channel");
        if (!channelId) return;

        const channel = member.guild.channels.cache.get(channelId);
        if (!channel) return;

        const embed = createEmbed({
            title: "New Member! 🕎",
            description: getWelcomeMessage(member.toString()),
            color: COLORS.SUCCESS,
            thumbnail: member.user.displayAvatarURL({ size: 256 }),
            fields: [
                { name: "Member Count", value: `We are now **${member.guild.memberCount}** strong! 💪`, inline: true },
                { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
            ],
        });

        channel.send({ embeds: [embed] }).catch(() => { });
    },
};
