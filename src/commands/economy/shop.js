/**
 * /shop — Browse and buy items with shekels.
 */
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { getEconomy, addBalance, addItem, hasItem, getInventory } = require("../../utils/database");
const { SHOP_ITEMS } = require("../../utils/jewishFlavor");
const { createEmbed, successEmbed, errorEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("Browse the Shuk — buy items with your shekels! 🛍️")
        .addStringOption((o) =>
            o.setName("action").setDescription("What to do")
                .addChoices(
                    { name: "Browse items", value: "browse" },
                    { name: "View my inventory", value: "inventory" },
                )
        )
        .addStringOption((o) =>
            o.setName("buy").setDescription("Item ID to buy (see /shop browse)")
        ),

    async execute(interaction) {
        const action = interaction.options.getString("action") || "browse";
        const buyId = interaction.options.getString("buy");

        if (buyId) {
            return handleBuy(interaction, buyId);
        }

        if (action === "inventory") {
            return handleInventory(interaction);
        }

        // Browse shop
        const shopList = SHOP_ITEMS.map((item) =>
            `${item.emoji} **${item.name}** — ₪${item.price.toLocaleString()}\n   *${item.description}*\n   ID: \`${item.id}\``
        ).join("\n\n");

        return interaction.reply({
            embeds: [createEmbed({
                title: "The Shuk 🛍️",
                description: `Welcome to the market! Use \`/shop buy:<item_id>\` to purchase.\n\n${shopList}`,
                color: COLORS.ECONOMY,
            })],
        });
    },
};

async function handleBuy(interaction, itemId) {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) {
        return interaction.reply({ embeds: [errorEmbed("Not Found", "That item doesn't exist in the Shuk! Check `/shop` for available items.")], ephemeral: true });
    }

    const eco = getEconomy(interaction.user.id, interaction.guild.id);
    if (eco.balance < item.price) {
        return interaction.reply({
            embeds: [errorEmbed("Can't Afford!", `You need ₪${item.price.toLocaleString()} but only have ₪${eco.balance.toLocaleString()}.\n\nGo \`/work\` or \`/daily\` to earn more!`)],
            ephemeral: true,
        });
    }

    addBalance(interaction.user.id, interaction.guild.id, -item.price);
    addItem(interaction.user.id, interaction.guild.id, item.id);

    return interaction.reply({
        embeds: [successEmbed(
            "Purchase Complete! 🛒",
            `You bought ${item.emoji} **${item.name}** for ₪${item.price.toLocaleString()}!\n\n*${item.description}*`
        )],
    });
}

async function handleInventory(interaction) {
    const inventory = getInventory(interaction.user.id, interaction.guild.id);

    if (inventory.length === 0) {
        return interaction.reply({
            embeds: [createEmbed({
                title: "Your Inventory 🎒",
                description: "Empty! You own nothing. Like the Israelites before reaching the Promised Land. 🏜️\n\nVisit `/shop` to buy something!",
                color: COLORS.ECONOMY,
            })],
        });
    }

    const items = inventory.map((inv) => {
        const item = SHOP_ITEMS.find((i) => i.id === inv.item_id);
        return item ? `${item.emoji} **${item.name}** x${inv.quantity}` : `❓ Unknown item: ${inv.item_id} x${inv.quantity}`;
    }).join("\n");

    return interaction.reply({
        embeds: [createEmbed({
            title: "Your Inventory 🎒",
            description: items,
            color: COLORS.ECONOMY,
        })],
    });
}
