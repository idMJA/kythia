/**
 * @namespace: addons/economy/commands/deposit.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.1
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
            .setName('deposit')
            .setDescription('💰 Deposit your kythia coin into kythia bank.')
            .addStringOption((option) =>
                option
                    .setName('type')
                    .setDescription('Choose deposit type: all or partial')
                    .setRequired(true)
                    .addChoices({ name: 'Deposit All', value: 'all' }, { name: 'Deposit Partial', value: 'partial' })
            )
            .addIntegerOption((option) => option.setName('amount').setDescription('Amount to deposit').setRequired(false).setMinValue(1)),
    async execute(interaction) {
        await interaction.deferReply();
        const type = interaction.options.getString('type');
        let amount = interaction.options.getInteger('amount');

        let user = await KythiaUser.getCache({ userId: interaction.user.id });
        if (!user) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(await t(interaction, 'economy_withdraw_no_account_desc'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        if (type === 'all') {
            amount = user.kythiaCoin;
        } else if (type === 'partial') {
            if (amount === null) {
                const embed = new EmbedBuilder()
                    .setColor('Yellow')
                    .setDescription(await t(interaction, 'economy_deposit_deposit_amount_required'))
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter(await embedFooter(interaction));
                return interaction.editReply({ embeds: [embed] });
            }
        }

        if (amount <= 0) {
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setDescription(await t(interaction, 'economy_deposit_deposit_invalid_amount'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        if (user.kythiaCoin < amount) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(await t(interaction, 'economy_deposit_deposit_not_enough_cash'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        if (amount === 0) {
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setDescription(await t(interaction, 'economy_deposit_deposit_zero_cash'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        // Check max balance based on user's bank type
        const userBank = BankManager.getBank(user.bankType);
        const maxBalance = userBank.maxBalance;
        
        if (user.kythiaBank + amount > maxBalance) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(await t(interaction, 'economy_deposit_deposit_max_balance', { max: maxBalance.toLocaleString() }))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        user.kythiaCoin -= amount;
        user.kythiaBank += amount;
        user.changed('kythiaCoin', true);
        user.changed('kythiaBank', true);
        await user.saveAndUpdateCache('userId');

        const embed = new EmbedBuilder()
            .setColor(kythia.bot.color)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setDescription(await t(interaction, 'economy_deposit_deposit_success', { amount }))
            .setFooter(await embedFooter(interaction));

        return interaction.editReply({ embeds: [embed] });
    },
};
