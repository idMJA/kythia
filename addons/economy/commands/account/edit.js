/**
 * @namespace: addons/economy/commands/account/edit.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.3
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const BankManager = require('@addons/economy/helpers/bankManager');
const { embedFooter } = require('@utils/discord');
const KythiaUser = require('@coreModels/KythiaUser');
const { t } = require('@utils/translator');

module.exports = {
    subcommand: true,
    data: (subcommand) =>
        subcommand
            .setName('edit')
            .setDescription('👤 Edit your account and choose a bank type.')
            .addStringOption((option) =>
                option
                    .setName('bank')
                    .setDescription('Each bank offers unique benefits for your playstyle!')
                    .setRequired(true)
                    .addChoices(
                        ...BankManager.getAllBanks().map((bank) => ({
                            name: `${bank.emoji} ${bank.name}`,
                            value: bank.id,
                        }))
                    )
            ),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const bankType = interaction.options.getString('bank');
            const userId = interaction.user.id;
            const userBank = BankManager.getBank(bankType);
            const bankDisplay = `${userBank.emoji} ${userBank.name}`;

            // Check if user has an account
            const existingUser = await KythiaUser.getCache({ userId: userId });
            if (!existingUser) {
                const embed = new EmbedBuilder()
                    .setColor(kythia.bot.color)
                    .setDescription(await t(interaction, 'economy_withdraw_no_account_desc'))
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter(await embedFooter(interaction));
                return interaction.editReply({ embeds: [embed] });
            }

            // Update user's bank type
            existingUser.bankType = bankType;
            existingUser.changed('bankType', true);
            await existingUser.saveAndUpdateCache('userId');

            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(
                    await t(interaction, 'economy_account_edit_account_edit_success_desc', { bankType: bankDisplay })
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error during account edit command execution:', error);
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(await t(interaction, 'economy_account_edit_account_edit_error_desc'))
                .setTimestamp()
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }
    },
};
