/**
 * MessageReactionAdd event — handles reaction role grants.
 */
const { getReactionRole } = require("../utils/database");

module.exports = {
    name: "messageReactionAdd",
    once: false,
    async execute(reaction, user) {
        if (user.bot) return;

        // Handle partial reactions
        if (reaction.partial) {
            try { await reaction.fetch(); } catch { return; }
        }

        const emoji = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
        const rr = getReactionRole(reaction.message.id, emoji);
        if (!rr) return;

        const guild = reaction.message.guild;
        if (!guild) return;

        try {
            const member = await guild.members.fetch(user.id);
            await member.roles.add(rr.role_id);
        } catch (error) {
            console.error("Failed to add reaction role:", error);
        }
    },
};
