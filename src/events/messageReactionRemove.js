/**
 * MessageReactionRemove event — handles reaction role removals.
 */
const { getReactionRole } = require("../utils/database");

module.exports = {
    name: "messageReactionRemove",
    once: false,
    async execute(reaction, user) {
        if (user.bot) return;

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
            await member.roles.remove(rr.role_id);
        } catch (error) {
            console.error("Failed to remove reaction role:", error);
        }
    },
};
