/**
 * @namespace: addons/economy/commands/market/buy.js
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
            .setName('buy')
            .setDescription('💸 Buy an asset from the global market.')
            .addStringOption((option) =>
                option
                    .setName('asset')
                    .setDescription('The symbol of the asset you want to buy (e.g., BTC, ETH)')
                    .setRequired(true)
                    .addChoices(...ASSET_IDS.map((id) => ({ name: id.toUpperCase(), value: id })))
            )
            .addNumberOption((option) =>
                option.setName('amount').setDescription('The amount of KythiaCoin you want to spend').setRequired(true).setMinValue(1)
            ),

    async execute(interaction) {
        await interaction.deferReply();

        const assetId = interaction.options.getString('asset');
        const amountToSpend = interaction.options.getNumber('amount');

        let user = await KythiaUser.getCache({ userId: interaction.user.id });
        if (!user) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(await t(interaction, 'economy_withdraw_no_account_desc'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        if (user.kythiaCoin < amountToSpend) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(`## ${await t(interaction, 'economy_market_buy_insufficient_funds_title')}\n${await t(interaction, 'economy_market_buy_insufficient_funds_desc', { amount: amountToSpend.toLocaleString() })}`)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        const marketData = await getMarketData();
        const assetData = marketData[assetId];

        if (!assetData) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(`## ${await t(interaction, 'economy_market_buy_asset_not_found_title')}\n${await t(interaction, 'economy_market_buy_asset_not_found_desc')}`)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        const currentPrice = assetData.usd;
        const quantityToBuy = amountToSpend / currentPrice;

        try {
            const existingHolding = await MarketPortfolio.findOne({
                where: { userId: interaction.user.id, assetId: assetId },
            });

            if (existingHolding) {
                const oldQuantity = existingHolding.quantity;
                const oldAvgPrice = existingHolding.avgBuyPrice;

                const newTotalQuantity = oldQuantity + quantityToBuy;
                const newAvgBuyPrice = (oldQuantity * oldAvgPrice + quantityToBuy * currentPrice) / newTotalQuantity;

                existingHolding.quantity = newTotalQuantity;
                existingHolding.avgBuyPrice = newAvgBuyPrice;
                await existingHolding.save();
            } else {
                await MarketPortfolio.create({
                    userId: interaction.user.id,
                    assetId: assetId,
                    quantity: quantityToBuy,
                    avgBuyPrice: currentPrice,
                });
            }

            user.kythiaCoin -= amountToSpend;
            await user.saveAndUpdateCache();

            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(
                    `## ${await t(interaction, 'economy_market_buy_success_title')}\n${await t(interaction, 'economy_market_buy_success_desc', { quantity: quantityToBuy.toFixed(6), asset: assetId.toUpperCase(), amount: amountToSpend.toLocaleString() })}`
                )
                .setFooter(await embedFooter(interaction));

            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error during market buy:', error);
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(`## ${await t(interaction, 'economy_market_buy_error_title')}\n${await t(interaction, 'economy_market_buy_error_desc')}`)
                .setFooter(await embedFooter(interaction));
            await interaction.editReply({ embeds: [embed] });
        }
    },
};
