/**
 * /ticket — Open a support ticket (creates a private channel).
 */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, PermissionsBitField } = require("discord.js");
const { getSetting, getDb, saveDatabase } = require("../../utils/database");
const { createEmbed, successEmbed, errorEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Open a support ticket 🎟️")
        .addSubcommand(sub => sub
            .setName("open")
            .setDescription("Open a new support ticket")
            .addStringOption(o => o.setName("subject").setDescription("What do you need help with?").setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName("close")
            .setDescription("Close this ticket channel")
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (getSetting(guildId, 'module_tickets') === 'false') {
            return interaction.reply({ embeds: [errorEmbed("Disabled", "The ticket system is not enabled on this server.")], ephemeral: true });
        }

        if (sub === "open") {
            const subject = interaction.options.getString("subject");
            const db = getDb();
            if (!db.tickets) db.tickets = {};
            if (!db.tickets[guildId]) db.tickets[guildId] = { counter: 0, active: {} };

            // Check if user already has an open ticket
            const existingTicket = Object.values(db.tickets[guildId].active).find(t => t.userId === interaction.user.id);
            if (existingTicket) {
                return interaction.reply({
                    embeds: [errorEmbed("Already Open", `You already have an open ticket: <#${existingTicket.channelId}>`)],
                    ephemeral: true,
                });
            }

            db.tickets[guildId].counter += 1;
            const ticketNum = db.tickets[guildId].counter;
            const channelName = `ticket-${ticketNum}-${interaction.user.username.slice(0, 10)}`;

            // Get category if set
            const categoryId = getSetting(guildId, 'ticket_category');

            try {
                const ticketChannel = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: categoryId || undefined,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
                        },
                    ],
                    topic: `Ticket #${ticketNum} — ${subject} (Opened by ${interaction.user.tag})`,
                });

                db.tickets[guildId].active[ticketChannel.id] = {
                    userId: interaction.user.id,
                    subject,
                    channelId: ticketChannel.id,
                    number: ticketNum,
                    openedAt: Date.now(),
                };
                saveDatabase();

                // Send welcome embed in ticket channel
                const embed = createEmbed({
                    title: `Ticket #${ticketNum} 🎟️`,
                    description: [
                        `**Opened by:** ${interaction.user}`,
                        `**Subject:** ${subject}`,
                        "",
                        "A staff member will be with you shortly.",
                        "Use `/ticket close` when your issue is resolved.",
                        "",
                        "*May your wait be shorter than the line at the Western Wall.*",
                    ].join("\n"),
                    color: COLORS.INFO,
                });

                await ticketChannel.send({ embeds: [embed] });

                return interaction.reply({
                    embeds: [successEmbed("Ticket Created", `Your ticket has been opened: ${ticketChannel}\n\n*A messenger has been dispatched.*`)],
                    ephemeral: true,
                });
            } catch (e) {
                console.error("Ticket creation error:", e);
                return interaction.reply({
                    embeds: [errorEmbed("Error", "Failed to create ticket channel. Check bot permissions.")],
                    ephemeral: true,
                });
            }
        }

        if (sub === "close") {
            const db = getDb();
            const ticket = db.tickets?.[guildId]?.active?.[interaction.channel.id];

            if (!ticket) {
                return interaction.reply({
                    embeds: [errorEmbed("Not a Ticket", "This channel is not a ticket channel.")],
                    ephemeral: true,
                });
            }

            // Only allow the ticket creator or mods to close
            if (ticket.userId !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.reply({
                    embeds: [errorEmbed("No Permission", "Only the ticket creator or a moderator can close this ticket.")],
                    ephemeral: true,
                });
            }

            await interaction.reply({
                embeds: [createEmbed({
                    title: "Ticket Closing 🔒",
                    description: "This ticket will be deleted in 5 seconds...\n\n*Another case closed. The Sanhedrin rests.*",
                    color: COLORS.WARNING,
                })],
            });

            delete db.tickets[guildId].active[interaction.channel.id];
            saveDatabase();

            setTimeout(async () => {
                try {
                    await interaction.channel.delete('Ticket closed');
                } catch (e) {
                    console.error("Failed to delete ticket channel:", e);
                }
            }, 5000);
        }
    },
};
