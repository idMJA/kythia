/**
 * @namespace: addons/economy/commands/lootbox.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.3
 */
const { checkCooldown } = require('@utils/time');
const { embedFooter } = require('@utils/discord');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KythiaUser = require('@coreModels/KythiaUser');
const ServerSetting = require('@coreModels/ServerSetting');
const { t } = require('@utils/translator');
const BankManager = require('../helpers/bankManager');

module.exports = {
    subcommand: true,
    data: (subcommand) => subcommand.setName('lootbox').setDescription('🎁 Open a lootbox to get a random reward.'),
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
        // Check if lootbox feature is enabled in server settings
        const cooldown = checkCooldown(user.lastLootbox, kythia.addons.economy.lootboxCooldown || 43200); // Default to 12 hours
        if (cooldown.remaining) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(await t(interaction, 'economy_lootbox_lootbox_cooldown', { time: cooldown.time }))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        // Randomize lootbox reward between 100 and 500
        const baseReward = Math.floor(Math.random() * 401) + 100;
        
        // Apply bank income bonus
        const userBank = BankManager.getBank(user.bankType);
        const incomeBonusPercent = userBank.incomeBonusPercent;
        const bankBonus = Math.floor(baseReward * (incomeBonusPercent / 100));
        const randomReward = baseReward + bankBonus;
        
        user.kythiaCoin += randomReward; 
        user.lastLootbox = Date.now();
        user.changed('kythiaCoin', true);
        user.changed('lastLootbox', true);
        await user.saveAndUpdateCache('userId');

        const embed = new EmbedBuilder()
            .setColor(kythia.bot.color)
            .setTitle(await t(interaction, 'economy_lootbox_lootbox_title'))
            .setThumbnail(interaction.user.displayAvatarURL())
            .setDescription(await t(interaction, 'economy_lootbox_lootbox_success', { amount: randomReward }))
            .setFooter(await embedFooter(interaction));
        await interaction.editReply({ embeds: [embed] });
    },
};
