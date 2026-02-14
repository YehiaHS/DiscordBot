/**
 * /customcmd — Create, edit, delete, and list custom commands.
 * Supports text responses, built-in function calls, and sandboxed code execution.
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getDb, saveDatabase } = require("../../utils/database");
const { createEmbed, successEmbed, errorEmbed, COLORS } = require("../../utils/embedBuilder");
const { BUILTIN_FUNCTIONS } = require("../../features/dashboardServer");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("customcmd")
        .setDescription("Manage custom commands 🔧")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub
            .setName("create")
            .setDescription("Create a new custom command")
            .addStringOption(o => o.setName("trigger").setDescription("The trigger word/phrase (e.g. !hello)").setRequired(true))
            .addStringOption(o => o
                .setName("type")
                .setDescription("Command type")
                .setRequired(true)
                .addChoices(
                    { name: '📝 Text Response', value: 'text' },
                    { name: '⚡ Built-in Function', value: 'function' },
                    { name: '💻 Custom Code', value: 'code' },
                )
            )
            .addStringOption(o => o.setName("response").setDescription("Response text (for text type). Use {user}, {server}, {members}, {random:1-100}"))
            .addStringOption(o => o
                .setName("function")
                .setDescription("Built-in function name (for function type)")
                .addChoices(
                    { name: '😂 Random Jewish Joke', value: 'getJoke' },
                    { name: '🔥 Random Roast', value: 'getRoast' },
                    { name: '📚 Random Jewish Fact', value: 'getFact' },
                    { name: '🇮🇱 Random Hebrew Word', value: 'getHebrewWord' },
                    { name: '🎭 Random Meme Caption', value: 'getMemeCaption' },
                    { name: '🎲 Coin Flip', value: 'coinflip' },
                    { name: '🎱 Jewish 8-Ball', value: 'eightball' },
                    { name: '🔢 Random Number', value: 'random_number' },
                )
            )
            .addStringOption(o => o.setName("code").setDescription("JavaScript code (for code type). Access: user, server, channel, random(), pick()"))
            .addStringOption(o => o.setName("description").setDescription("What does this command do?"))
            .addBooleanOption(o => o.setName("embed").setDescription("Wrap response in an embed? (default: false)"))
        )
        .addSubcommand(sub => sub
            .setName("delete")
            .setDescription("Delete a custom command")
            .addStringOption(o => o.setName("trigger").setDescription("Trigger to delete").setRequired(true))
        )
        .addSubcommand(sub => sub
            .setName("list")
            .setDescription("List all custom commands")
        )
        .addSubcommand(sub => sub
            .setName("edit")
            .setDescription("Edit an existing custom command's response")
            .addStringOption(o => o.setName("trigger").setDescription("Trigger to edit").setRequired(true))
            .addStringOption(o => o.setName("response").setDescription("New response text"))
            .addStringOption(o => o.setName("code").setDescription("New JavaScript code"))
            .addStringOption(o => o
                .setName("function")
                .setDescription("New built-in function")
                .addChoices(
                    { name: '😂 Random Jewish Joke', value: 'getJoke' },
                    { name: '🔥 Random Roast', value: 'getRoast' },
                    { name: '📚 Random Jewish Fact', value: 'getFact' },
                    { name: '🇮🇱 Random Hebrew Word', value: 'getHebrewWord' },
                    { name: '🎭 Random Meme Caption', value: 'getMemeCaption' },
                    { name: '🎲 Coin Flip', value: 'coinflip' },
                    { name: '🎱 Jewish 8-Ball', value: 'eightball' },
                    { name: '🔢 Random Number', value: 'random_number' },
                )
            )
        )
        .addSubcommand(sub => sub
            .setName("test")
            .setDescription("Test a custom command without saving it")
            .addStringOption(o => o
                .setName("type")
                .setDescription("Command type")
                .setRequired(true)
                .addChoices(
                    { name: '📝 Text Response', value: 'text' },
                    { name: '⚡ Built-in Function', value: 'function' },
                    { name: '💻 Custom Code', value: 'code' },
                )
            )
            .addStringOption(o => o.setName("response").setDescription("Response text to test"))
            .addStringOption(o => o
                .setName("function")
                .setDescription("Built-in function to test")
                .addChoices(
                    { name: '😂 Random Jewish Joke', value: 'getJoke' },
                    { name: '🔥 Random Roast', value: 'getRoast' },
                    { name: '📚 Random Jewish Fact', value: 'getFact' },
                    { name: '🇮🇱 Random Hebrew Word', value: 'getHebrewWord' },
                    { name: '🎭 Random Meme Caption', value: 'getMemeCaption' },
                    { name: '🎲 Coin Flip', value: 'coinflip' },
                    { name: '🎱 Jewish 8-Ball', value: 'eightball' },
                    { name: '🔢 Random Number', value: 'random_number' },
                )
            )
            .addStringOption(o => o.setName("code").setDescription("JavaScript code to test"))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const db = getDb();
        if (!db.custom_commands) db.custom_commands = {};
        if (!db.custom_commands[guildId]) db.custom_commands[guildId] = [];

        const commands = db.custom_commands[guildId];

        // ---- CREATE ----
        if (sub === "create") {
            const trigger = interaction.options.getString("trigger").toLowerCase();
            const type = interaction.options.getString("type");
            const response = interaction.options.getString("response");
            const functionName = interaction.options.getString("function");
            const code = interaction.options.getString("code");
            const description = interaction.options.getString("description") || '';
            const embed = interaction.options.getBoolean("embed") || false;

            // Validate
            if (type === 'text' && !response) {
                return interaction.reply({ embeds: [errorEmbed("Missing Response", "Text type requires the `response` option.")], ephemeral: true });
            }
            if (type === 'function' && !functionName) {
                return interaction.reply({ embeds: [errorEmbed("Missing Function", "Function type requires the `function` option.")], ephemeral: true });
            }
            if (type === 'code' && !code) {
                return interaction.reply({ embeds: [errorEmbed("Missing Code", "Code type requires the `code` option.")], ephemeral: true });
            }

            // Check duplicate
            if (commands.find(c => c.trigger === trigger)) {
                return interaction.reply({ embeds: [errorEmbed("Already Exists", `A command with trigger \`${trigger}\` already exists. Use \`/customcmd edit\` to modify it.`)], ephemeral: true });
            }

            commands.push({
                trigger,
                type,
                response: response || '',
                functionName: functionName || '',
                code: code || '',
                description,
                embed,
                embedColor: '#f5c842',
                embedTitle: trigger,
                createdBy: interaction.user.id,
                createdAt: Date.now(),
            });
            saveDatabase();

            const typeLabel = { text: '📝 Text', function: '⚡ Function', code: '💻 Code' }[type];

            return interaction.reply({
                embeds: [successEmbed(
                    "Command Created 🔧",
                    [
                        `**Trigger:** \`${trigger}\``,
                        `**Type:** ${typeLabel}`,
                        `**Description:** ${description || '*None*'}`,
                        `**Embed:** ${embed ? 'Yes' : 'No'}`,
                        "",
                        type === 'text' ? `**Response:** ${response.slice(0, 100)}${response.length > 100 ? '...' : ''}` : '',
                        type === 'function' ? `**Function:** ${BUILTIN_FUNCTIONS[functionName]?.label || functionName}` : '',
                        type === 'code' ? `**Code:** \`\`\`js\n${code.slice(0, 100)}${code.length > 100 ? '...' : ''}\n\`\`\`` : '',
                        "",
                        "*Your custom command is now live. Type the trigger in any channel to use it.*",
                    ].filter(Boolean).join("\n")
                )],
            });
        }

        // ---- DELETE ----
        if (sub === "delete") {
            const trigger = interaction.options.getString("trigger").toLowerCase();
            const idx = commands.findIndex(c => c.trigger === trigger);
            if (idx === -1) {
                return interaction.reply({ embeds: [errorEmbed("Not Found", `No command with trigger \`${trigger}\`.`)], ephemeral: true });
            }

            commands.splice(idx, 1);
            saveDatabase();

            return interaction.reply({
                embeds: [successEmbed("Command Deleted 🗑️", `Custom command \`${trigger}\` has been removed.\n\n*The Sanhedrin has spoken.*`)],
            });
        }

        // ---- LIST ----
        if (sub === "list") {
            if (!commands.length) {
                return interaction.reply({
                    embeds: [createEmbed({
                        title: "Custom Commands 🔧",
                        description: "No custom commands configured.\n\nUse `/customcmd create` or the **Command Center** dashboard to create one.",
                        color: COLORS.INFO,
                    })],
                    ephemeral: true,
                });
            }

            const typeIcons = { text: '📝', function: '⚡', code: '💻' };
            const lines = commands.map((c, i) => {
                const icon = typeIcons[c.type] || '📝';
                return `**${i + 1}.** ${icon} \`${c.trigger}\` — ${c.description || '*No description*'}`;
            });

            return interaction.reply({
                embeds: [createEmbed({
                    title: `Custom Commands (${commands.length}) 🔧`,
                    description: lines.join("\n"),
                    color: COLORS.INFO,
                    footer: "Manage via /customcmd or the Command Center dashboard",
                })],
                ephemeral: true,
            });
        }

        // ---- EDIT ----
        if (sub === "edit") {
            const trigger = interaction.options.getString("trigger").toLowerCase();
            const idx = commands.findIndex(c => c.trigger === trigger);
            if (idx === -1) {
                return interaction.reply({ embeds: [errorEmbed("Not Found", `No command with trigger \`${trigger}\`.`)], ephemeral: true });
            }

            const newResponse = interaction.options.getString("response");
            const newFunction = interaction.options.getString("function");
            const newCode = interaction.options.getString("code");

            if (newResponse) {
                commands[idx].response = newResponse;
                commands[idx].type = 'text';
            }
            if (newFunction) {
                commands[idx].functionName = newFunction;
                commands[idx].type = 'function';
            }
            if (newCode) {
                commands[idx].code = newCode;
                commands[idx].type = 'code';
            }

            commands[idx].updatedAt = Date.now();
            saveDatabase();

            return interaction.reply({
                embeds: [successEmbed("Command Updated ✏️", `Custom command \`${trigger}\` has been updated.`)],
            });
        }

        // ---- TEST ----
        if (sub === "test") {
            const { executeCustomCommand } = require("../../features/dashboardServer");
            const type = interaction.options.getString("type");
            const response = interaction.options.getString("response");
            const functionName = interaction.options.getString("function");
            const code = interaction.options.getString("code");

            const cmd = { type, response: response || '', functionName: functionName || '', code: code || '' };
            const result = executeCustomCommand(cmd, {
                author: interaction.user,
                guild: interaction.guild,
                channel: interaction.channel,
            });

            return interaction.reply({
                embeds: [createEmbed({
                    title: "Test Result 🧪",
                    description: `**Output:**\n${result || '*Empty response*'}`,
                    color: COLORS.INFO,
                    footer: "This is a test — nothing was saved or sent to any channel.",
                })],
                ephemeral: true,
            });
        }
    },
};
