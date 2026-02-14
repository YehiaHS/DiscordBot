const { EmbedBuilder } = require('discord.js');
const { addLog, getSetting } = require('../utils/database');

const LOG_TYPES = {
    MESSAGE_DELETE: 'message_delete',
    MESSAGE_UPDATE: 'message_update',
    MEMBER_JOIN: 'member_join',
    MEMBER_LEAVE: 'member_leave',
    WARN: 'warn',
    MUTE: 'mute',
    KICK: 'kick',
    BAN: 'ban'
};

/**
 * Handles message deletion logging.
 * @param {import('discord.js').Message} message 
 */
async function handleMessageDelete(message) {
    if (message.partial || message.author?.bot) return;

    const content = JSON.stringify({
        channelId: message.channel.id,
        channelName: message.channel.name,
        content: message.content,
        authorTag: message.author.tag
    });

    addLog(message.guild.id, LOG_TYPES.MESSAGE_DELETE, content, message.author.id);
    await sendToLogChannel(message.guild, 'Message Deleted', `**Author:** ${message.author.tag} (${message.author.id})\n**Channel:** ${message.channel}\n**Content:** ${message.content || '*No content (maybe embed/attachment)*'}`, 0xff4d4d);
}

/**
 * Handles message update logging.
 * @param {import('discord.js').Message} oldMessage 
 * @param {import('discord.js').Message} newMessage 
 */
async function handleMessageUpdate(oldMessage, newMessage) {
    if (oldMessage.partial) await oldMessage.fetch();
    if (oldMessage.author?.bot || oldMessage.content === newMessage.content) return;

    const content = JSON.stringify({
        channelId: oldMessage.channel.id,
        oldContent: oldMessage.content,
        newContent: newMessage.content,
        authorTag: oldMessage.author.tag
    });

    addLog(oldMessage.guild.id, LOG_TYPES.MESSAGE_UPDATE, content, oldMessage.author.id);
    await sendToLogChannel(oldMessage.guild, 'Message Edited', `**Author:** ${oldMessage.author.tag} (${oldMessage.author.id})\n**Channel:** ${oldMessage.channel}\n**Before:** ${oldMessage.content}\n**After:** ${newMessage.content}`, 0x2c52ed);
}

/**
 * Handles member join logging.
 * @param {import('discord.js').GuildMember} member 
 */
async function handleMemberJoin(member) {
    const content = JSON.stringify({
        userTag: member.user.tag,
        userId: member.id,
        createdTimestamp: member.user.createdTimestamp
    });

    addLog(member.guild.id, LOG_TYPES.MEMBER_JOIN, content, member.id);
    await sendToLogChannel(member.guild, 'Member Joined', `**User:** ${member.user.tag} (${member.id})\n**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, 0x00ff88);
}

/**
 * Handles member leave logging.
 * @param {import('discord.js').GuildMember} member 
 */
async function handleMemberLeave(member) {
    const content = JSON.stringify({
        userTag: member.user.tag,
        userId: member.id
    });

    addLog(member.guild.id, LOG_TYPES.MEMBER_LEAVE, content, member.id);
    await sendToLogChannel(member.guild, 'Member Left', `**User:** ${member.user.tag} (${member.id})`, 0xffbb00);
}

/**
 * Sends a log entry to the designated log channel.
 * @param {import('discord.js').Guild} guild 
 * @param {string} title 
 * @param {string} description 
 * @param {number} color 
 */
async function sendToLogChannel(guild, title, description, color) {
    const logChannelId = getSetting(guild.id, 'mod_log_channel');
    if (!logChannelId) return;

    const channel = guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle(`✡️ ${title}`)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();

    await channel.send({ embeds: [embed] });
}

module.exports = {
    handleMessageDelete,
    handleMessageUpdate,
    handleMemberJoin,
    handleMemberLeave,
    sendToLogChannel,
    LOG_TYPES
};
