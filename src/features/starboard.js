/**
 * Starboard feature — pins popular messages to a starboard channel.
 */
const { EmbedBuilder } = require('discord.js');
const { getSetting, getDb, saveDatabase } = require('../utils/database');

/**
 * Handle a reaction being added — check if it should go to starboard.
 * @param {import('discord.js').MessageReaction} reaction
 * @param {import('discord.js').User} user
 */
async function handleStarboardReaction(reaction, user) {
    if (user.bot) return;

    // Check if starboard module is enabled
    if (getSetting(reaction.message.guild.id, 'module_starboard') === 'false') return;

    const guildId = reaction.message.guild.id;
    const starEmoji = getSetting(guildId, 'starboard_emoji') || '⭐';
    const threshold = parseInt(getSetting(guildId, 'starboard_threshold') || '3');
    const channelId = getSetting(guildId, 'starboard_channel');
    const allowSelfStar = getSetting(guildId, 'starboard_self_star') === 'true';

    if (!channelId) return;

    // Check if the reaction matches the star emoji
    const emojiMatch = reaction.emoji.name === starEmoji || reaction.emoji.toString() === starEmoji;
    if (!emojiMatch) return;

    // Don't allow self-starring unless enabled
    if (!allowSelfStar && reaction.message.author.id === user.id) return;

    // Get reaction count
    const reactionCount = reaction.count || 0;
    if (reactionCount < threshold) return;

    // Get or create the starboard entry
    const db = getDb();
    if (!db.starboard) db.starboard = {};
    if (!db.starboard[guildId]) db.starboard[guildId] = {};

    const messageId = reaction.message.id;
    const starboardChannel = reaction.message.guild.channels.cache.get(channelId);
    if (!starboardChannel) return;

    try {
        // Fetch the full message
        const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;

        const starEmbed = new EmbedBuilder()
            .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL() })
            .setDescription(message.content || '*No text content*')
            .setColor(0xf5c842)
            .addFields({ name: 'Source', value: `[Jump to Message](${message.url})`, inline: true })
            .setFooter({ text: `${starEmoji} ${reactionCount} | #${message.channel.name}` })
            .setTimestamp(message.createdTimestamp);

        // Add first image attachment if any
        const imageAttachment = message.attachments.find(a => a.contentType?.startsWith('image/'));
        if (imageAttachment) {
            starEmbed.setImage(imageAttachment.url);
        }

        // Check if we already posted this to starboard
        const existingEntry = db.starboard[guildId][messageId];

        if (existingEntry) {
            // Update the existing starboard message
            try {
                const starMsg = await starboardChannel.messages.fetch(existingEntry.starboardMessageId);
                await starMsg.edit({ embeds: [starEmbed] });
            } catch {
                // Original starboard message was deleted — re-post
                const newMsg = await starboardChannel.send({ embeds: [starEmbed] });
                db.starboard[guildId][messageId] = { starboardMessageId: newMsg.id, count: reactionCount };
                saveDatabase();
            }
        } else {
            // Post new starboard entry
            const starMsg = await starboardChannel.send({ embeds: [starEmbed] });
            db.starboard[guildId][messageId] = { starboardMessageId: starMsg.id, count: reactionCount };
            saveDatabase();
        }
    } catch (error) {
        console.error('Starboard error:', error);
    }
}

module.exports = { handleStarboardReaction };
