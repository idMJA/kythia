/**
 * @namespace: addons/economy/commands/withdraw.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.1
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KythiaUser = require('@coreModels/KythiaUser');
const { embedFooter } = require('@utils/discord');
const { t } = require('@utils/translator');

module.exports = {
    subcommand: true,
    data: (subcommand) =>
        subcommand
            .setName('withdraw')
            .setDescription('Withdraw your kythia coin from kythia bank.')
            .addIntegerOption((option) => option.setName('amount').setDescription('Amount to withdraw').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const amount = interaction.options.getInteger('amount');
            const user = await KythiaUser.getCache({ userId: interaction.user.id });

            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor(kythia.bot.color)
                    .setDescription(await t(interaction, 'economy_withdraw_no_account_desc'))
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter(await embedFooter(interaction));
                return interaction.editReply({ embeds: [embed] });
            }

            if (user.kythiaBank < amount) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(await t(interaction, 'economy_withdraw_withdraw_not_enough_bank'))
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter(await embedFooter(interaction));
                return interaction.editReply({ embeds: [embed] });
            }

            user.kythiaBank -= amount;
            user.kythiaCoin += amount;
            user.changed('kythiaBank', true);
            user.changed('kythiaCoin', true);
            await user.saveAndUpdateCache('userId');

            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setDescription(
                    await t(interaction, 'economy_withdraw_withdraw_success', {
                        user: interaction.user.username,
                        amount,
                    })
                )
                .setTimestamp()
                .setFooter(await embedFooter(interaction));
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error during withdraw command execution:', error);
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(await t(interaction, 'economy_withdraw_withdraw_error'))
                .setTimestamp();
            return interaction.editReply({ embeds: [embed] });
        }
    },
};
