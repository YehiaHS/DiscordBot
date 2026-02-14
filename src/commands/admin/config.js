/**
 * /config — Master admin command to control all Jewbot parameters from Discord.
 * Covers: modules, automod, mossad, leveling, economy, starboard, autorole, channels.
 */
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { getSetting, setSetting } = require("../../utils/database");
const { createEmbed, successEmbed, errorEmbed, COLORS } = require("../../utils/embedBuilder");
const { CONFIG_SCHEMA } = require("../../features/dashboardServer");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("config")
        .setDescription("Control all Jewbot settings from Discord ⚙️")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        // /config view [category]
        .addSubcommand(sub => sub
            .setName("view")
            .setDescription("View current settings for a category")
            .addStringOption(o => o
                .setName("category")
                .setDescription("Settings category")
                .setRequired(true)
                .addChoices(
                    { name: "⚙️ General", value: "general" },
                    { name: "📦 Modules", value: "modules" },
                    { name: "🛡️ Auto-Mod", value: "automod" },
                    { name: "🕵️ Mossad Agent", value: "mossad" },
                    { name: "📊 Leveling", value: "leveling" },
                    { name: "💰 Economy", value: "economy" },
                    { name: "⭐ Starboard", value: "starboard" },
                    { name: "🎭 Auto-Role", value: "autorole" },
                )
            )
        )

        // /config set <key> <value>
        .addSubcommand(sub => sub
            .setName("set")
            .setDescription("Set a specific configuration value")
            .addStringOption(o => o
                .setName("key")
                .setDescription("Setting key (e.g. xp_min, rob_success_chance)")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addStringOption(o => o
                .setName("value")
                .setDescription("New value")
                .setRequired(true)
            )
        )

        // /config toggle <module>
        .addSubcommand(sub => sub
            .setName("toggle")
            .setDescription("Toggle a module on/off")
            .addStringOption(o => o
                .setName("module")
                .setDescription("Module to toggle")
                .setRequired(true)
                .addChoices(
                    { name: "Moderation", value: "module_moderation" },
                    { name: "Leveling", value: "module_leveling" },
                    { name: "Economy", value: "module_economy" },
                    { name: "Auto-Mod", value: "module_automod" },
                    { name: "Mossad Agent", value: "module_mossad" },
                    { name: "Starboard", value: "module_starboard" },
                    { name: "Ticket System", value: "module_tickets" },
                    { name: "Auto-Role", value: "module_autorole" },
                    { name: "Anti-Invite", value: "automod_anti_invite" },
                    { name: "Anti-Spam", value: "automod_anti_spam" },
                    { name: "Anti-Mass Mention", value: "automod_anti_massmention" },
                    { name: "Anti-Caps", value: "automod_anti_caps" },
                    { name: "Level-Up Announcements", value: "levelup_announce" },
                    { name: "Starboard Self-Stars", value: "starboard_self_star" },
                )
            )
        )

        // /config channel <setting> <channel>
        .addSubcommand(sub => sub
            .setName("channel")
            .setDescription("Set a channel for a feature")
            .addStringOption(o => o
                .setName("feature")
                .setDescription("Which feature")
                .setRequired(true)
                .addChoices(
                    { name: "Welcome Messages", value: "welcome_channel" },
                    { name: "Mod Logs", value: "mod_log_channel" },
                    { name: "Mossad Agent", value: "mossad_channel" },
                    { name: "Starboard", value: "starboard_channel" },
                    { name: "Level-Up Announcements", value: "levelup_channel" },
                    { name: "Ticket Category", value: "ticket_category" },
                )
            )
            .addChannelOption(o => o
                .setName("channel")
                .setDescription("The channel to set")
                .setRequired(true)
            )
        )

        // /config reset [category]
        .addSubcommand(sub => sub
            .setName("reset")
            .setDescription("Reset a category to defaults")
            .addStringOption(o => o
                .setName("category")
                .setDescription("Category to reset")
                .setRequired(true)
                .addChoices(
                    { name: "All Settings", value: "all" },
                    { name: "Auto-Mod", value: "automod" },
                    { name: "Mossad Agent", value: "mossad" },
                    { name: "Leveling", value: "leveling" },
                    { name: "Economy", value: "economy" },
                    { name: "Starboard", value: "starboard" },
                    { name: "Auto-Role", value: "autorole" },
                )
            )
        )

        // /config autorole <role>
        .addSubcommand(sub => sub
            .setName("autorole")
            .setDescription("Set the auto-role for new members")
            .addRoleOption(o => o
                .setName("role")
                .setDescription("Role to auto-assign on join")
                .setRequired(true)
            )
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        // ---- VIEW ----
        if (sub === "view") {
            const categoryKey = interaction.options.getString("category");
            const category = CONFIG_SCHEMA[categoryKey];
            if (!category) {
                return interaction.reply({ embeds: [errorEmbed("Error", "Unknown category.")], ephemeral: true });
            }

            const lines = [];
            for (const [key, schema] of Object.entries(category.settings)) {
                const value = getSetting(guildId, key) ?? schema.default;
                let display = value;

                if (schema.type === 'toggle') {
                    display = value === 'true' ? '✅ Enabled' : '❌ Disabled';
                } else if (schema.type === 'channel' && value) {
                    display = `<#${value}>`;
                } else if (schema.type === 'role' && value) {
                    display = `<@&${value}>`;
                } else if (!value) {
                    display = '*Not set*';
                }

                lines.push(`**${schema.label}** → ${display}\n*${schema.description}*\n\`Key: ${key}\``);
            }

            return interaction.reply({
                embeds: [createEmbed({
                    title: `Settings — ${category.label}`,
                    description: lines.join("\n\n"),
                    color: COLORS.INFO,
                })],
                ephemeral: true,
            });
        }

        // ---- SET ----
        if (sub === "set") {
            const key = interaction.options.getString("key");
            const value = interaction.options.getString("value");

            // Find the schema for this key
            let schema = null;
            for (const cat of Object.values(CONFIG_SCHEMA)) {
                if (cat.settings[key]) {
                    schema = cat.settings[key];
                    break;
                }
            }

            if (!schema) {
                return interaction.reply({
                    embeds: [errorEmbed("Unknown Setting", `\`${key}\` is not a valid setting key.\n\nUse \`/config view\` to see available keys.`)],
                    ephemeral: true,
                });
            }

            // Validate
            if (schema.type === 'number') {
                const num = parseInt(value);
                if (isNaN(num)) {
                    return interaction.reply({ embeds: [errorEmbed("Invalid Value", "This setting requires a number.")], ephemeral: true });
                }
                if (schema.min !== undefined && num < schema.min) {
                    return interaction.reply({ embeds: [errorEmbed("Too Low", `Minimum value is ${schema.min}.`)], ephemeral: true });
                }
                if (schema.max !== undefined && num > schema.max) {
                    return interaction.reply({ embeds: [errorEmbed("Too High", `Maximum value is ${schema.max}.`)], ephemeral: true });
                }
            }

            if (schema.type === 'select' && schema.options && !schema.options.includes(value)) {
                return interaction.reply({
                    embeds: [errorEmbed("Invalid Option", `Valid options: ${schema.options.map(o => `\`${o}\``).join(', ')}`)],
                    ephemeral: true,
                });
            }

            if (schema.type === 'toggle') {
                const parsedValue = ['true', 'on', 'yes', '1', 'enable', 'enabled'].includes(value.toLowerCase()) ? 'true' : 'false';
                setSetting(guildId, key, parsedValue);
                const state = parsedValue === 'true' ? '✅ Enabled' : '❌ Disabled';
                return interaction.reply({
                    embeds: [successEmbed("Setting Updated", `**${schema.label}** → ${state}`)],
                    ephemeral: true,
                });
            }

            setSetting(guildId, key, value);
            return interaction.reply({
                embeds: [successEmbed("Setting Updated", `**${schema.label}** → \`${value}\`\n\n*${schema.description}*`)],
                ephemeral: true,
            });
        }

        // ---- TOGGLE ----
        if (sub === "toggle") {
            const key = interaction.options.getString("module");
            const current = getSetting(guildId, key);
            const newValue = current === 'true' ? 'false' : 'true';
            setSetting(guildId, key, newValue);

            // Find label
            let label = key;
            for (const cat of Object.values(CONFIG_SCHEMA)) {
                if (cat.settings[key]) {
                    label = cat.settings[key].label;
                    break;
                }
            }

            const state = newValue === 'true' ? '✅ Enabled' : '❌ Disabled';
            return interaction.reply({
                embeds: [successEmbed("Toggled", `**${label}** → ${state}`)],
                ephemeral: true,
            });
        }

        // ---- CHANNEL ----
        if (sub === "channel") {
            const feature = interaction.options.getString("feature");
            const channel = interaction.options.getChannel("channel");
            setSetting(guildId, feature, channel.id);

            let label = feature;
            for (const cat of Object.values(CONFIG_SCHEMA)) {
                if (cat.settings[feature]) {
                    label = cat.settings[feature].label;
                    break;
                }
            }

            return interaction.reply({
                embeds: [successEmbed("Channel Set", `**${label}** → ${channel}`)],
                ephemeral: true,
            });
        }

        // ---- RESET ----
        if (sub === "reset") {
            const categoryKey = interaction.options.getString("category");

            if (categoryKey === "all") {
                for (const cat of Object.values(CONFIG_SCHEMA)) {
                    for (const [key, schema] of Object.entries(cat.settings)) {
                        setSetting(guildId, key, schema.default);
                    }
                }
                return interaction.reply({
                    embeds: [successEmbed("Full Reset", "All settings have been restored to factory defaults. May the bot be reborn. ✡️")],
                    ephemeral: true,
                });
            }

            const category = CONFIG_SCHEMA[categoryKey];
            if (!category) {
                return interaction.reply({ embeds: [errorEmbed("Error", "Unknown category.")], ephemeral: true });
            }

            for (const [key, schema] of Object.entries(category.settings)) {
                setSetting(guildId, key, schema.default);
            }

            return interaction.reply({
                embeds: [successEmbed("Category Reset", `**${category.label}** reset to defaults.`)],
                ephemeral: true,
            });
        }

        // ---- AUTOROLE ----
        if (sub === "autorole") {
            const role = interaction.options.getRole("role");
            setSetting(guildId, "autorole_id", role.id);
            setSetting(guildId, "module_autorole", "true");

            return interaction.reply({
                embeds: [successEmbed("Auto-Role Set", `New members will automatically receive ${role}.\n\n*The tribes are organizing themselves. Every new settler gets their badge.*`)],
                ephemeral: true,
            });
        }
    },
};
