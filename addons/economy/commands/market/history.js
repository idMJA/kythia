/**
 * @namespace: addons/economy/commands/market/history.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.3
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KythiaUser = require('@coreModels/KythiaUser');
const MarketTransaction = require('../../database/models/MarketTransaction');
const { t } = require('@utils/translator');
const { embedFooter } = require('@utils/discord');

module.exports = {
    subcommand: true,
    data: (subcommand) => subcommand.setName('history').setDescription('View your transaction history.'),

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
            const transactions = await MarketTransaction.findAll({
                where: { userId: interaction.user.id },
                order: [['createdAt', 'DESC']],
                limit: 10, // Limit to the last 10 transactions for now
            });

            if (transactions.length === 0) {
                const emptyEmbed = new EmbedBuilder()
                    .setColor(kythia.bot.color)
                    .setDescription(
                        `## ${await t(interaction, 'economy_market_history_empty_title')}\n${await t(interaction, 'economy_market_history_empty_desc')}`
                    )
                    .setFooter(await embedFooter(interaction));
                return interaction.editReply({ embeds: [emptyEmbed] });
            }

            const description = transactions
                .map((tx) => {
                    const side = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
                    const emoji = tx.type === 'buy' ? '🟢' : '🔴';
                    return `${emoji} **${side} ${tx.quantity.toFixed(6)} ${tx.assetId.toUpperCase()}** at $${tx.price.toLocaleString()} each\n*${new Date(tx.createdAt).toLocaleString()}*`;
                })
                .join('\n\n');

            const historyEmbed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setTitle(await t(interaction, 'economy_market_history_title', { username: interaction.user.username }))
                .setDescription(description)
                .setFooter(await embedFooter(interaction));

            await interaction.editReply({ embeds: [historyEmbed] });
        } catch (error) {
            console.error('Error in history command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(
                    `## ${await t(interaction, 'economy_market_history_error_title')}\n${await t(interaction, 'economy_market_history_error_desc')}`
                );
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
