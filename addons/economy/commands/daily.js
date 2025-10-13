/**
 * @namespace: addons/economy/commands/daily.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.3
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KythiaUser = require('@coreModels/KythiaUser');
const { embedFooter } = require('@utils/discord');
const { checkCooldown } = require('@utils/time');
const { t } = require('@utils/translator');
const BankManager = require('../helpers/bankManager');

module.exports = {
    subcommand: true,
    data: (subcommand) => subcommand.setName('daily').setDescription('💰 Collect your daily kythia coin.'),
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

        const cooldown = checkCooldown(user.lastDaily, kythia.addons.economy.dailyCooldown || 86400); // Default to 24 hours
        if (cooldown.remaining) {
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setDescription(await t(interaction, 'economy_daily_daily_cooldown', { time: cooldown.time }))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        // Randomize the daily coin reward between 50 and 150
        const baseCoin = Math.floor(Math.random() * 101) + 50;
        
        // Apply bank income bonus
        const userBank = BankManager.getBank(user.bankType);
        const incomeBonusPercent = userBank.incomeBonusPercent;
        const bankBonus = Math.floor(baseCoin * (incomeBonusPercent / 100));
        const randomCoin = baseCoin + bankBonus;
        
        user.kythiaCoin += randomCoin;
        user.lastDaily = Date.now();
        user.changed('kythiaCoin', true);
        user.changed('lastDaily', true);
        await user.saveAndUpdateCache('userId');

        const embed = new EmbedBuilder()
            .setColor(kythia.bot.color)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setDescription(await t(interaction, 'economy_daily_daily_success', { amount: randomCoin }))
            .setFooter(await embedFooter(interaction));
        return interaction.editReply({ embeds: [embed] });
    },
};
