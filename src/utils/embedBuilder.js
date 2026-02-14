/**
 * Themed embed builder with Star of David styling, blue/white colors,
 * and random Jewish footer quips.
 */
const { EmbedBuilder } = require("discord.js");
const { getFooterQuip } = require("./jewishFlavor");

/** Blue-white color palette (Israeli flag vibes) */
const COLORS = {
    PRIMARY: 0x0038b8,   // Israeli blue
    SUCCESS: 0x00c853,   // Green for positive
    ERROR: 0xd50000,     // Red for errors
    WARNING: 0xffd600,   // Yellow/gold for warnings
    ECONOMY: 0xffd700,   // Gold for shekels
    LEVELING: 0x7c4dff,  // Purple for XP
    FUN: 0x00bcd4,       // Cyan for fun commands
    INFO: 0x2196f3,      // Light blue for info
};

/**
 * Create a themed embed with consistent styling.
 * @param {object} options
 * @param {string} options.title - Embed title
 * @param {string} options.description - Embed description
 * @param {number} [options.color] - Embed color (defaults to PRIMARY)
 * @param {string} [options.thumbnail] - Thumbnail URL
 * @param {Array} [options.fields] - Embed fields
 * @param {string} [options.footer] - Custom footer (default: random quip)
 * @param {boolean} [options.timestamp] - Whether to add timestamp
 * @returns {EmbedBuilder}
 */
function createEmbed({
    title,
    description,
    color = COLORS.PRIMARY,
    thumbnail,
    fields = [],
    footer,
    timestamp = true,
} = {}) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setFooter({ text: footer || getFooterQuip() });

    if (title) embed.setTitle(`✡️ ${title}`);
    if (description) embed.setDescription(description);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (fields.length > 0) embed.addFields(fields);
    if (timestamp) embed.setTimestamp();

    return embed;
}

/** Shortcut for success embeds */
function successEmbed(title, description) {
    return createEmbed({ title, description, color: COLORS.SUCCESS });
}

/** Shortcut for error embeds */
function errorEmbed(title, description) {
    return createEmbed({ title, description, color: COLORS.ERROR });
}

/** Shortcut for warning embeds */
function warningEmbed(title, description) {
    return createEmbed({ title, description, color: COLORS.WARNING });
}

module.exports = { createEmbed, successEmbed, errorEmbed, warningEmbed, COLORS };
