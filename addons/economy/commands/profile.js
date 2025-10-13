/**
 * @namespace: addons/economy/commands/profile.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.3
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KythiaUser = require('@coreModels/KythiaUser');
const { embedFooter } = require('@utils/discord');
const { t } = require('@utils/translator');
const BankManager = require('../helpers/bankManager');

module.exports = {
    subcommand: true,
    data: (subcommand) =>
        subcommand
            .setName('profile')
            .setDescription("🗃️ View a user's full profile, including level, bank, cash, and more.")
            .addUserOption((option) => option.setName('user').setDescription('The user whose profile you want to view').setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();

        // Get target user or self
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;

        // Fetch user data
        const userData = await KythiaUser.getCache({ userId: userId });
        if (!userData) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(await t(interaction, 'economy_withdraw_no_account_desc'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }


        // Bank & coin
        let bank = userData.kythiaBank || 0;
        let coin = userData.kythiaCoin || 0;
        let bankType = userData.bankType ? userData.bankType.toUpperCase() : '-';
        let userBank = BankManager.getBank(bankType);
        const bankDisplay = `(${userBank.emoji} ${userBank.name})`;
        // Build embed using t for all text
        const embed = new EmbedBuilder()
            .setColor(kythia.bot.color)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setDescription(
                [
                    `## ${await t(interaction, 'economy_profile_profile_title')}`,
                    await t(interaction, 'economy_profile_profile_user_line', {
                        username: targetUser.username,
                        userId: targetUser.id,
                    }),
                    `### ${await t(interaction, 'economy_profile_profile_finance_title')}`,
                    await t(interaction, 'economy_profile_profile_bank_line', {
                        bank: bank.toLocaleString(),
                        bankType: bankDisplay || '',
                    }),
                    await t(interaction, 'economy_profile_profile_cash_line', {
                        cash: coin.toLocaleString(),
                    }),
                ].join('\n')
            )
            .setFooter(await embedFooter(interaction));

        return interaction.editReply({ embeds: [embed] });
    },
};
