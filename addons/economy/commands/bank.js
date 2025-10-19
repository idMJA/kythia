/**
 * @namespace: addons/economy/commands/bank.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.4
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { embedFooter } = require('@utils/discord');
const KythiaUser = require('@coreModels/KythiaUser');
const { t } = require('@utils/translator');
const BankManager = require('../helpers/bankManager');

module.exports = {
    subcommand: true,
    aliases: ['bank'],
    data: (subcommand) => subcommand.setName('bank').setDescription('💰 Check your kythia bank balance and full bank info.'),
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

        const userBankType = user.bankType || 'solara_mutual';
        const bank = BankManager.getBank(userBankType);

        const stats = [
            {
                label: await t(interaction, 'economy_bank_stat_income_bonus'),
                val: (bank.incomeBonusPercent >= 0 ? '+' : '') + bank.incomeBonusPercent + '%',
            },
            {
                label: await t(interaction, 'economy_bank_stat_interest_rate'),
                val: bank.interestRatePercent + '%',
            },
            {
                label: await t(interaction, 'economy_bank_stat_transfer_fee'),
                val: bank.transferFeePercent + '%',
            },
            {
                label: await t(interaction, 'economy_bank_stat_withdraw_fee'),
                val: bank.withdrawFeePercent + '%',
            },
            {
                label: await t(interaction, 'economy_bank_stat_rob_bonus'),
                val: (bank.robSuccessBonusPercent >= 0 ? '+' : '') + bank.robSuccessBonusPercent + '%',
            },
            {
                label: await t(interaction, 'economy_bank_stat_rob_penalty'),
                val: await t(interaction, 'economy_bank_rob_penalty_times', { times: bank.robPenaltyMultiplier }),
            },
            {
                label: await t(interaction, 'economy_bank_stat_max_balance'),
                val:
                    bank.maxBalance === Infinity
                        ? await t(interaction, 'economy_bank_max_balance_unlimited')
                        : bank.maxBalance.toLocaleString(),
            },
        ];

        const defaultBank = BankManager.getBank('solara_mutual');

        const pros = [];
        const cons = [];

        if (bank.incomeBonusPercent > defaultBank.incomeBonusPercent) pros.push(await t(interaction, 'economy_bank_pro_income_bonus'));
        if (bank.incomeBonusPercent < defaultBank.incomeBonusPercent) cons.push(await t(interaction, 'economy_bank_con_income_penalty'));

        if (bank.interestRatePercent > defaultBank.interestRatePercent) pros.push(await t(interaction, 'economy_bank_pro_interest_high'));

        if (bank.transferFeePercent < defaultBank.transferFeePercent) pros.push(await t(interaction, 'economy_bank_pro_transfer_low'));
        if (bank.transferFeePercent > defaultBank.transferFeePercent) cons.push(await t(interaction, 'economy_bank_con_transfer_high'));

        if (bank.robSuccessBonusPercent > defaultBank.robSuccessBonusPercent) pros.push(await t(interaction, 'economy_bank_pro_rob_bonus'));
        if (bank.robSuccessBonusPercent < defaultBank.robSuccessBonusPercent)
            cons.push(await t(interaction, 'economy_bank_con_rob_penalty'));

        if (bank.maxBalance === Infinity) pros.push(await t(interaction, 'economy_bank_pro_max_unlimited'));

        const descriptionParts = [
            `## ${bank.emoji} ${bank.name}`,
            await t(interaction, 'economy_bank_bank_balance_desc', {
                username: interaction.user.username,
                cash: user.kythiaCoin.toLocaleString(),
                bank: user.kythiaBank.toLocaleString(),
                bankType: `${bank.emoji} ${bank.name}`,
                total: (BigInt(user.kythiaCoin) + BigInt(user.kythiaBank)).toLocaleString(),
            }),
            `### ${await t(interaction, 'economy_bank_bank_stats_title')}`,
            stats.map((s) => `> ${s.label}: **${s.val}**`).join('\n'),
        ];

        if (pros.length || cons.length) {
            descriptionParts.push('\n');
            if (pros.length) {
                descriptionParts.push(`> **${await t(interaction, 'economy_bank_bank_pros')}:** ${pros.map((p) => `+ ${p}`).join(', ')}`);
            }
            if (cons.length) {
                descriptionParts.push(`> **${await t(interaction, 'economy_bank_bank_cons')}:** ${cons.map((c) => `- ${c}`).join(', ')}`);
            }
        }

        const embed = new EmbedBuilder()
            .setColor(kythia.bot.color)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setDescription(descriptionParts.join('\n'))
            .setFooter(await embedFooter(interaction));
        return interaction.editReply({ embeds: [embed] });
    },
};
