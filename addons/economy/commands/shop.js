/**
 * @namespace: addons/economy/commands/shop.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.3
 */
const {
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
} = require('discord.js');
const KythiaUser = require('@coreModels/KythiaUser');
const Inventory = require('@coreModels/Inventory');
const { embedFooter } = require('@utils/discord');
const shopData = require('../helpers/items');
const { t } = require('@utils/translator');

const allItems = Object.values(shopData).flat();

// Helper to safely format numbers
function safeLocaleString(value, fallback = '0') {
    return typeof value === 'number' && isFinite(value) ? value.toLocaleString() : fallback;
}

// Returns a ContainerBuilder, like @about.js, with all child components/rows/add-ons INSIDE the container, not outside!
async function generateShopContainer(interaction, user, category, page, pageItems, componentsBelow = []) {
    // Compose contextual data
    let cashDisplay = '0';
    if (user && typeof user.kythiaCoin !== 'undefined' && user.kythiaCoin !== null) {
        cashDisplay = safeLocaleString(user.kythiaCoin, '0');
    }
    const headerText = await t(interaction, 'economy_shop_desc', {
        bot: interaction.client.user.username,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        cash: cashDisplay,
    });

    let itemBlocks = [];
    if (pageItems.length === 0) {
        itemBlocks.push(
            new TextDisplayBuilder().setContent(
                `**${await t(interaction, 'economy_shop_empty_title')}**\n${await t(interaction, 'economy_shop_empty_desc')}`
            )
        );
    } else {
        for (const item of pageItems) {
            const itemName = await t(interaction, item.nameKey);
            const itemDesc = await t(interaction, item.descKey);
            const priceStr = safeLocaleString(item.price, '?');
            itemBlocks.push(new TextDisplayBuilder().setContent(`**${item.emoji} ${itemName} — 🪙 ${priceStr}**\n\`\`\`${itemDesc}\`\`\``));
        }
    }

    const totalPages = Math.max(
        1,
        Math.ceil(
            (category === 'all' ? allItems.filter((item) => item.buyable) : (shopData[category] || []).filter((item) => item.buyable))
                .length / 5
        )
    );
    page = Math.max(1, Math.min(page, totalPages));

    // Footer text
    const footerText = await t(interaction, 'economy_shop_footer', { page, totalPages });

    // Compose container in the @about.js style; all children go in add*Components, nothing in root "components"
    const container = new ContainerBuilder()
        .setAccentColor(kythia.bot.color ? parseInt(kythia.bot.color.replace('#', ''), 16) : undefined)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(...itemBlocks)
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(footerText ?? ''));

    // If action/control rows exist, add them INSIDE this container (see @about.js .addActionRowComponents)
    if (componentsBelow && componentsBelow.length) {
        container
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addActionRowComponents(...componentsBelow);
    }

    return {
        container,
        pageItems,
        page,
        totalPages,
    };
}

async function generateShopComponentRows(interaction, page, totalPages, category, pageItems) {
    const categoryOptions = await Promise.all(
        Object.keys(shopData).map(async (cat) => ({
            label: await t(interaction, `economy_shop_category_${cat}`),
            value: `shop_category_${cat}`,
            default: category === cat,
        }))
    );

    const categoryRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select_category')
            .setPlaceholder(await t(interaction, 'economy_shop_select_category_placeholder'))
            .addOptions([
                {
                    label: await t(interaction, 'economy_shop_category_all'),
                    value: 'shop_category_all',
                    default: category === 'all',
                },
                ...categoryOptions,
            ])
    );
    const buyOptions = await Promise.all(
        pageItems.map(async (item) => ({
            label: await t(interaction, item.nameKey),
            description: await t(interaction, 'economy_shop_item_price', { price: safeLocaleString(item.price, '?') }),
            value: item.id,
            emoji: item.emoji,
        }))
    );

    const buyRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('buy_item')
            .setPlaceholder(await t(interaction, 'economy_shop_buy_placeholder'))
            .setDisabled(pageItems.length === 0)
            .addOptions(buyOptions)
    );

    const navigationRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`shop_nav_first_${category}`)
            .setLabel(await t(interaction, 'economy_shop_nav_first'))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page <= 1),
        new ButtonBuilder()
            .setCustomId(`shop_nav_prev_${category}`)
            .setLabel(await t(interaction, 'economy_shop_nav_prev'))
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page <= 1),
        new ButtonBuilder()
            .setCustomId(`shop_nav_next_${category}`)
            .setLabel(await t(interaction, 'economy_shop_nav_next'))
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages),
        new ButtonBuilder()
            .setCustomId(`shop_nav_last_${category}`)
            .setLabel(await t(interaction, 'economy_shop_nav_last'))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages)
    );

    return [categoryRow, buyRow, navigationRow];
}

module.exports = {
    subcommand: true,
    data: (subcommand) => subcommand.setName('shop').setDescription('🛒 Look and buy items from the shop.'),

    async execute(interaction) {
        await interaction.deferReply();
        let user = await KythiaUser.getCache({ userId: interaction.user.id });
        if (!user) {
            const errContainer = new ContainerBuilder()
                .setAccentColor(kythia.bot.color ? parseInt(kythia.bot.color.replace('#', ''), 16) : undefined)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(await t(interaction, 'economy_withdraw_no_account_desc')))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(''));
            return interaction.reply({
                components: [errContainer],
                ephemeral: true,
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
            });
        }

        let currentPage = 1;
        let currentCategory = 'all';
        let itemsToShow =
            currentCategory === 'all'
                ? allItems.filter((item) => item.buyable)
                : (shopData[currentCategory] || []).filter((item) => item.buyable);
        let totalPages = Math.max(1, Math.ceil(itemsToShow.length / 5));
        let pageItems = itemsToShow.slice(0, 5);

        let components = await generateShopComponentRows(interaction, currentPage, totalPages, currentCategory, pageItems);
        let { container: shopContainer } = await generateShopContainer(
            interaction,
            user,
            currentCategory,
            currentPage,
            pageItems,
            components
        );

        const message = await interaction.editReply({
            components: [shopContainer],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
            fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                const errContainer = new ContainerBuilder()
                    .setAccentColor(kythia.bot.color ? parseInt(kythia.bot.color.replace('#', ''), 16) : undefined)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(await t(i, 'economy_shop_not_your_interaction_desc')));
                return i.reply({
                    components: [errContainer],
                    ephemeral: true,
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
                });
            }
            await i.deferUpdate();

            if (i.customId === 'select_category') {
                const selected = i.values[0];
                currentCategory = selected.replace('shop_category_', '');
                currentPage = 1;
            } else if (i.customId.startsWith('shop_nav_')) {
                const parts = i.customId.split('_');
                const navType = parts[2];
                const navCategory = parts.slice(3).join('_');
                if (navCategory) currentCategory = navCategory;
                if (navType === 'next') currentPage++;
                if (navType === 'prev') currentPage--;
                if (navType === 'first') currentPage = 1;
                if (navType === 'last') {
                    let navItemsToShow =
                        currentCategory === 'all'
                            ? allItems.filter((item) => item.buyable)
                            : (shopData[currentCategory] || []).filter((item) => item.buyable);
                    currentPage = Math.max(1, Math.ceil(navItemsToShow.length / 5));
                }
            } else if (i.customId === 'buy_item') {
                const itemId = i.values[0];
                const selectedItem = allItems.find((item) => item.id === itemId);

                if (!selectedItem) {
                    const errContainer = new ContainerBuilder()
                        .setAccentColor(kythia.bot.color ? parseInt(kythia.bot.color.replace('#', ''), 16) : undefined)
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(await t(i, 'economy_shop_item_not_found_desc')));
                    return i.followUp({
                        components: [errContainer],
                        ephemeral: true,
                        flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
                    });
                }

                const translatedItemName = await t(interaction, selectedItem.nameKey);
                const itemNameWithEmoji = `${selectedItem.emoji} ${translatedItemName}`;

                user = await KythiaUser.getCache({ userId: interaction.user.id });

                if (!user || typeof user.kythiaCoin !== 'number' || isNaN(user.kythiaCoin)) {
                    const errContainer = new ContainerBuilder()
                        .setAccentColor(kythia.bot.color ? parseInt(kythia.bot.color.replace('#', ''), 16) : undefined)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                await t(i, 'economy_shop_not_enough_money_desc', { item: itemNameWithEmoji })
                            )
                        );
                    return i.followUp({
                        components: [errContainer],
                        ephemeral: true,
                        flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
                    });
                }

                if (user.kythiaCoin < selectedItem.price) {
                    const errContainer = new ContainerBuilder()
                        .setAccentColor(kythia.bot.color ? parseInt(kythia.bot.color.replace('#', ''), 16) : undefined)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                await t(i, 'economy_shop_not_enough_money_desc', { item: itemNameWithEmoji })
                            )
                        );
                    return i.followUp({
                        components: [errContainer],
                        ephemeral: true,
                        flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
                    });
                }

                user.kythiaCoin -= selectedItem.price;
                await user.saveAndUpdateCache();

                await Inventory.create({ userId: user.userId, itemName: itemNameWithEmoji });

                const priceStr = safeLocaleString(selectedItem.price, '?');
                const successContainer = new ContainerBuilder()
                    .setAccentColor(kythia.bot.color ? parseInt(kythia.bot.color.replace('#', ''), 16) : undefined)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            await t(i, 'economy_shop_buy_success_desc', {
                                item: itemNameWithEmoji,
                                price: priceStr,
                            })
                        )
                    );
                await i.followUp({
                    components: [successContainer],
                    ephemeral: true,
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
                });
            }

            // Re-build the shop container with up-to-date category/page and correct row controls inside the container (NOT in the root "components" array)
            let itemsToShow =
                currentCategory === 'all'
                    ? allItems.filter((item) => item.buyable)
                    : (shopData[currentCategory] || []).filter((item) => item.buyable);
            totalPages = Math.max(1, Math.ceil(itemsToShow.length / 5));
            currentPage = Math.max(1, Math.min(currentPage, totalPages));
            const startIndex = (currentPage - 1) * 5;
            pageItems = itemsToShow.slice(startIndex, startIndex + 5);

            const newComponents = await generateShopComponentRows(interaction, currentPage, totalPages, currentCategory, pageItems);
            const { container: newShopContainer } = await generateShopContainer(
                interaction,
                await KythiaUser.getCache({ userId: interaction.user.id }),
                currentCategory,
                currentPage,
                pageItems,
                newComponents
            );
            await interaction.editReply({ components: [newShopContainer], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
        });

        collector.on('end', async () => {
            try {
                await interaction.editReply({ components: [] });
            } catch {}
        });
    },
};
