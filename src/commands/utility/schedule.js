/**
 * /schedule — Schedule a message to be sent at a specific time.
 * Uses setTimeout internally — works on Termux with no cron needed.
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getDb, saveDatabase } = require("../../utils/database");
const { createEmbed, successEmbed, errorEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("schedule")
        .setDescription("Schedule a message to be sent later ⏰")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(sub => sub
            .setName("send")
            .setDescription("Schedule a message")
            .addStringOption(o => o.setName("message").setDescription("The message to send").setRequired(true))
            .addStringOption(o => o
                .setName("delay")
                .setDescription("When to send (e.g. 1h, 30m, 2d)")
                .setRequired(true)
            )
            .addChannelOption(o => o.setName("channel").setDescription("Target channel (default: current)"))
        )
        .addSubcommand(sub => sub
            .setName("list")
            .setDescription("View all scheduled messages")
        )
        .addSubcommand(sub => sub
            .setName("cancel")
            .setDescription("Cancel a scheduled message")
            .addStringOption(o => o.setName("id").setDescription("The schedule ID to cancel").setRequired(true))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const db = getDb();
        if (!db.scheduled) db.scheduled = {};
        if (!db.scheduled[guildId]) db.scheduled[guildId] = [];

        if (sub === "send") {
            const content = interaction.options.getString("message");
            const delayStr = interaction.options.getString("delay");
            const channel = interaction.options.getChannel("channel") || interaction.channel;

            // Parse delay
            const ms = parseDelay(delayStr);
            if (!ms || ms < 60_000) {
                return interaction.reply({ embeds: [errorEmbed("Invalid Delay", "Use formats like: 10m, 1h, 6h, 1d, 3d. Minimum 1 minute.")], ephemeral: true });
            }

            if (ms > 30 * 24 * 60 * 60 * 1000) {
                return interaction.reply({ embeds: [errorEmbed("Too Far", "Maximum scheduling window is 30 days.")], ephemeral: true });
            }

            const sendsAt = Date.now() + ms;
            const id = `sch_${Date.now().toString(36)}`;

            const entry = {
                id,
                content,
                channelId: channel.id,
                authorId: interaction.user.id,
                sendsAt,
                sent: false,
            };

            db.scheduled[guildId].push(entry);
            saveDatabase();

            // Schedule the send
            scheduleMessage(interaction.client, guildId, entry);

            const sendsTimestamp = Math.floor(sendsAt / 1000);

            return interaction.reply({
                embeds: [successEmbed("Message Scheduled ⏰", `Your message will be sent to ${channel} at <t:${sendsTimestamp}:f> (<t:${sendsTimestamp}:R>)\n\n**ID:** \`${id}\``)],
                ephemeral: true,
            });
        }

        if (sub === "list") {
            const pending = db.scheduled[guildId].filter(s => !s.sent && s.sendsAt > Date.now());
            if (!pending.length) {
                return interaction.reply({ embeds: [createEmbed({ title: "⏰ Scheduled Messages", description: "No pending scheduled messages.", color: COLORS.INFO })], ephemeral: true });
            }

            const lines = pending.map(s => {
                const ts = Math.floor(s.sendsAt / 1000);
                return `\`${s.id}\` → <#${s.channelId}> at <t:${ts}:f>\n> ${s.content.slice(0, 60)}${s.content.length > 60 ? '...' : ''}`;
            });

            return interaction.reply({
                embeds: [createEmbed({ title: "⏰ Scheduled Messages", description: lines.join("\n\n"), color: COLORS.INFO })],
                ephemeral: true,
            });
        }

        if (sub === "cancel") {
            const id = interaction.options.getString("id");
            const idx = db.scheduled[guildId].findIndex(s => s.id === id && !s.sent);

            if (idx === -1) {
                return interaction.reply({ embeds: [errorEmbed("Not Found", `No pending schedule with ID \`${id}\`.`)], ephemeral: true });
            }

            db.scheduled[guildId].splice(idx, 1);
            saveDatabase();

            return interaction.reply({
                embeds: [successEmbed("Cancelled", `Schedule \`${id}\` has been cancelled.`)],
                ephemeral: true,
            });
        }
    },
};

/**
 * Parse a human-readable delay string like "1h", "30m", "2d".
 */
function parseDelay(str) {
    const match = str.match(/^(\d+)\s*(m|min|mins|minutes?|h|hr|hrs|hours?|d|days?|w|weeks?)$/i);
    if (!match) return null;

    const num = parseInt(match[1]);
    const unit = match[2].toLowerCase()[0]; // first char

    const multipliers = { m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
    return num * (multipliers[unit] || 0);
}

/**
 * Set a timeout to send a scheduled message. Safe for Termux — pure JS setTimeout.
 */
function scheduleMessage(client, guildId, entry) {
    const delay = entry.sendsAt - Date.now();
    if (delay <= 0) return;

    // Cap at max safe setTimeout
    const safeDelay = Math.min(delay, 2147483647);

    setTimeout(async () => {
        const db = getDb();
        const scheduled = db.scheduled?.[guildId]?.find(s => s.id === entry.id);
        if (!scheduled || scheduled.sent) return;

        scheduled.sent = true;
        saveDatabase();

        try {
            const guild = client.guilds.cache.get(guildId);
            const channel = guild?.channels.cache.get(entry.channelId);
            if (channel) {
                await channel.send(entry.content);
            }
        } catch (e) {
            console.error('Scheduled message send error:', e);
        }
    }, safeDelay);
}

/**
 * Boot-time: reschedule any unsent messages from previous sessions.
 * Call this from index.js on client ready.
 */
function rescheduleAll(client) {
    const db = getDb();
    if (!db.scheduled) return;

    for (const [guildId, schedules] of Object.entries(db.scheduled)) {
        for (const entry of schedules) {
            if (!entry.sent && entry.sendsAt > Date.now()) {
                scheduleMessage(client, guildId, entry);
            }
        }
    }
}

module.exports.rescheduleAll = rescheduleAll;
