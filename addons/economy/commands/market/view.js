/**
 * @namespace: addons/economy/commands/market/view.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.3
 */

const { getMarketData, ASSET_IDS, getChartBuffer } = require('../../helpers/market');
const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const KythiaUser = require('@coreModels/KythiaUser');
const MarketOrder = require('../../database/models/MarketOrder');
const { embedFooter } = require('@utils/discord');
const { t } = require('@utils/translator');

function formatMarketTable(rows) {
    return ['```', 'SYMBOL   |    PRICE (USD)  |  24H CHANGE', '----------------------------------------', ...rows, '```'].join('\n');
}

function getChangeEmoji(percent) {
    if (percent > 0) return '🟢 ▲';
    if (percent < 0) return '🔻 ▼';
    return '⏹️';
}

module.exports = {
    subcommand: true,
    data: (subcommand) =>
        subcommand
            .setName('view')
            .setDescription('📈 View real-time crypto prices from the global market.')
            .addStringOption((option) =>
                option
                    .setName('asset')
                    .setDescription('The symbol of the asset to view, or leave empty for all')
                    .setRequired(false)
                    .addChoices(...ASSET_IDS.map((id) => ({ name: id.toUpperCase(), value: id })))
            ),

    async execute(interaction) {
        await interaction.deferReply();

        let user = await KythiaUser.getCache({ userId: interaction.user.id });
        if (!user) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(await t(interaction, 'economy_withdraw_no_account_desc'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        try {
            const marketData = await getMarketData();
            const assetId = interaction.options.getString('asset');
            let embed;
            let files = [];

            if (assetId) {
                // --- Single asset mode (menyiapkan embed chart) ---
                const data = marketData[assetId];
                if (!data) {
                    embed = new EmbedBuilder().setColor('Red').setDescription(`## ${await t(interaction, 'economy_market_view_asset_not_found_title')}\n${await t(interaction, 'economy_market_view_asset_not_found_desc', { asset: assetId.toUpperCase() })}`);
                } else {
                    const percent = data.usd_24h_change.toFixed(2);
                    const emoji = getChangeEmoji(data.usd_24h_change);

                    embed = new EmbedBuilder()
                        .setColor(kythia.bot.color)
                        .setTitle(await t(interaction, 'economy_market_view_chart_title', { asset: assetId.toUpperCase() }))
                        .addFields(
                            { name: await t(interaction, 'economy_market_view_price_label'), value: `$${data.usd.toLocaleString()}`, inline: true },
                            { name: await t(interaction, 'economy_market_view_24h_change_label'), value: `${emoji} ${percent}%`, inline: true },
                            { name: await t(interaction, 'economy_market_view_market_cap_label'), value: `$${data.usd_market_cap.toLocaleString()}`, inline: true },
                            { name: await t(interaction, 'economy_market_view_24h_vol_label'), value: `$${data.usd_24h_vol.toLocaleString()}`, inline: true },
                        )
                        .setFooter(await embedFooter(interaction));

                    const openOrders = await MarketOrder.findAll({
                        where: {
                            userId: interaction.user.id,
                            assetId: assetId,
                            status: 'open',
                        },
                    });

                    if (openOrders.length > 0) {
                        const orderSummary = openOrders.map(order => {
                            return `- **${order.side.toUpperCase()} ${order.quantity} ${order.assetId.toUpperCase()}** at $${order.price} (${order.type})`;
                        }).join('\n');
                        embed.addFields({ name: await t(interaction, 'economy_market_view_open_orders_label'), value: orderSummary });
                    }

                    const chartBuffer = await getChartBuffer(assetId);
                    if (chartBuffer) {
                        const attachment = new AttachmentBuilder(chartBuffer, { name: 'market-chart.png' });
                        files.push(attachment);
                        embed.setImage('attachment://market-chart.png');
                    }
                }
            } else {
                // --- All assets mode (menyiapkan embed tabel) ---
                const assetRows = ASSET_IDS.map((id) => {
                    const data = marketData[id];
                    if (!data) {
                        return `${id.toUpperCase().padEnd(8)}| ${'Data not found'.padEnd(15)}| N/A`;
                    }
                    const symbol = id.toUpperCase().padEnd(8);
                    const price = `$${data.usd.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`.padEnd(15);
                    const percent = data.usd_24h_change.toFixed(2);
                    const emoji = getChangeEmoji(data.usd_24h_change);
                    const change = `${emoji} ${percent}%`;

                    return `${symbol}| ${price}| ${change}`;
                });
                const prettyTable = formatMarketTable(assetRows);

                embed = new EmbedBuilder()
                    .setColor(kythia.bot.color)
                    .setDescription(`## ${await t(interaction, 'economy_market_view_all_title')}\n` + prettyTable)
                    .setFooter(await embedFooter(interaction));
            }

            await interaction.editReply({ embeds: [embed], files: files });
        } catch (error) {
            console.error('Error in market view:', error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`## ${await t(interaction, 'economy_market_view_error_title')}\n${await t(interaction, 'economy_market_view_error_desc')}`);
            if (!interaction.replied) await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
