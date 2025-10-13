/**
 * @namespace: addons/economy/commands/market/sell.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.3
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KythiaUser = require('@coreModels/KythiaUser');
const MarketPortfolio = require('../../database/models/MarketPortfolio');
const { getMarketData, ASSET_IDS } = require('../../helpers/market');
const { t } = require('@utils/translator');
const { embedFooter } = require('@utils/discord');

module.exports = {
    subcommand: true,
    data: (subcommand) =>
        subcommand
            .setName('sell')
            .setDescription('💰 Sell an asset to the global market.')
            .addStringOption((option) =>
                option
                    .setName('asset')
                    .setDescription('The symbol of the asset you want to sell (e.g., BTC, ETH)')
                    .setRequired(true)
                    .addChoices(...ASSET_IDS.map((id) => ({ name: id.toUpperCase(), value: id })))
            )
            .addNumberOption((option) =>
                option.setName('quantity').setDescription('The amount of the asset you want to sell (e.g., 0.5)').setRequired(true).setMinValue(0.000001)
            ),

    async execute(interaction) {
        await interaction.deferReply();

        const assetId = interaction.options.getString('asset');
        const sellQuantity = interaction.options.getNumber('quantity');

        let user = await KythiaUser.getCache({ userId: interaction.user.id });
        if (!user) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(await t(interaction, 'economy_withdraw_no_account_desc'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        const holding = await MarketPortfolio.findOne({
            where: { userId: interaction.user.id, assetId: assetId },
        });

        if (!holding || holding.quantity < sellQuantity) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(`## ${await t(interaction, 'economy_market_sell_insufficient_asset_title')}\n${await t(interaction, 'economy_market_sell_insufficient_asset_desc', { asset: assetId.toUpperCase() })}`)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        const marketData = await getMarketData();
        const assetData = marketData[assetId];

        if (!assetData) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(`## ${await t(interaction, 'economy_market_sell_asset_not_found_title')}\n${await t(interaction, 'economy_market_sell_asset_not_found_desc')}`)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        const currentPrice = assetData.usd;
        const totalUsdReceived = sellQuantity * currentPrice;

        try {
            // Calculate new quantity
            const newQuantity = holding.quantity - sellQuantity;
            if (newQuantity > 0) {
                holding.quantity = newQuantity;
                await holding.save();
            } else {
                await holding.destroy();
            }

            // Add the sell value to user's KythiaCoin
            user.kythiaCoin += totalUsdReceived;
            await user.saveAndUpdateCache();

            const pnl = (currentPrice - holding.avgBuyPrice) * sellQuantity;
            const pnlSign = pnl >= 0 ? '+' : '';
            const pnlEmoji = pnl >= 0 ? '📈' : '📉';

            const successEmbed = new EmbedBuilder()
                .setColor('Yellow')
                .setDescription(
                    `## ${await t(interaction, 'economy_market_sell_success_title')}\n${await t(interaction, 'economy_market_sell_success_desc', { quantity: sellQuantity.toFixed(6), asset: assetId.toUpperCase(), amount: totalUsdReceived.toLocaleString(undefined, { maximumFractionDigits: 2 }), avgBuyPrice: holding.avgBuyPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }), sellPrice: currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }), pnlEmoji: pnlEmoji, pnlSign: pnlSign, pnl: pnl.toLocaleString(undefined, { maximumFractionDigits: 2 }) })}`
                )
                .setFooter(await embedFooter(interaction));

            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error during market sell:', error);
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(`## ${await t(interaction, 'economy_market_sell_error_title')}\n${await t(interaction, 'economy_market_sell_error_desc')}`)
                .setFooter(await embedFooter(interaction));
            await interaction.editReply({ embeds: [embed] });
        }
    },
};