/**
 * @namespace: addons/economy/commands/hack.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.3
 */

const { embedFooter } = require('@utils/discord');
const { checkCooldown } = require('@utils/time');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KythiaUser = require('@coreModels/KythiaUser');
const Inventory = require('@coreModels/Inventory');
const { t } = require('@utils/translator');
const BankManager = require('../helpers/bankManager');

module.exports = {
    subcommand: true,
    data: (subcommand) =>
        subcommand
            .setName('hack')
            .setDescription('💵 Hack another user.')
            .addUserOption((option) => option.setName('target').setDescription('User you want to hack').setRequired(true)),
    guildOnly: true,

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('target');
        const user = await KythiaUser.getCache({ userId: interaction.user.id });
        const target = await KythiaUser.getCache({ userId: targetUser.id });

        // Check if user exists
        if (!user) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(await t(interaction, 'economy_withdraw_no_account_desc'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        // Cooldown check
        const cooldown = checkCooldown(user.lastHack, kythia.addons.economy.hackCooldown || 7200); // Default to 2 hours
        if (cooldown.remaining) {
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setDescription(await t(interaction, 'economy_hack_hack_cooldown', { time: cooldown.time }))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        // Validate user and target
        if (!user || !target) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(await t(interaction, 'economy_hack_hack_user_or_target_not_found'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        // Prevent self-hack
        if (targetUser.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(await t(interaction, 'economy_hack_hack_self'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        // Target must have money in kythiaBank
        if (target.kythiaBank <= 0) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(await t(interaction, 'economy_hack_hack_target_no_bank'))
                .setThumbnail(targetUser.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        // User must have enough money in kythiaBank to hack
        if (user.kythiaBank <= 20) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(await t(interaction, 'economy_hack_hack_user_no_bank'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        // Fake hack embed
        const embed = new EmbedBuilder()
            .setDescription(
                await t(interaction, 'economy_hack_hack_in_progress', {
                    user: interaction.user.username,
                    target: targetUser.username,
                    chance: user.hackMastered || 10,
                })
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            .setColor(kythia.bot.color);

        await interaction.editReply({ embeds: [embed] });

        const desktop = await Inventory.findOne({ where: { userId: interaction.user.id, itemName: '🖥️ Desktop' } });
        let successChance = 1;
        if (desktop) {
            successChance = 1.5;
        }

        setTimeout(async () => {
            const hackResult = Math.random() < ((user.hackMastered || 10) / 100) * successChance ? 'success' : 'failure';

            if (hackResult === 'success') {
                // Transfer all target's kythiaBank to user with rob success bonus
                const userBank = BankManager.getBank(user.bankType);
                const robSuccessBonusPercent = userBank.robSuccessBonusPercent;
                const hackBonus = Math.floor(target.kythiaBank * (robSuccessBonusPercent / 100));
                const totalHacked = target.kythiaBank + hackBonus;

                user.kythiaBank += totalHacked;
                if (user.hackMastered < 100) {
                    user.hackMastered = (user.hackMastered || 10) + 1;
                }
                target.kythiaBank = 0;
                user.lastHack = Date.now(); // Set lastHack like @beg.js
                user.changed('kythiaBank', true);
                user.changed('lastHack', true); // Mark lastHack as changed
                target.changed('kythiaBank', true);
                await user.saveAndUpdateCache('userId');
                await target.saveAndUpdateCache('userId');

                // DM notification to the victim like rob.js
                const embedToTarget = new EmbedBuilder()
                    .setColor('Red')
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setDescription(
                        await t(interaction, 'economy_hack_hack_success_dm', {
                            hacker: interaction.user.username,
                            amount: totalHacked,
                        })
                    )
                    .setFooter(await embedFooter(interaction));
                try {
                    await targetUser.send({ embeds: [embedToTarget] });
                } catch (err) {
                    // Ignore DM errors
                }

                const successEmbed = new EmbedBuilder()
                    .setColor(kythia.bot.color)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setDescription(
                        await t(interaction, 'economy_hack_hack_success', {
                            target: targetUser.username,
                        })
                    )
                    .setFooter(await embedFooter(interaction));

                await interaction.editReply({ embeds: [successEmbed] });
            } else {
                // Penalty if failed with rob penalty multiplier
                const userBank = BankManager.getBank(user.bankType || 'solara_mutual');
                const robPenaltyMultiplier = userBank ? userBank.robPenaltyMultiplier : 1;
                const basePenalty = Math.floor(Math.random() * 20) + 1;
                const penalty = Math.floor(basePenalty * robPenaltyMultiplier);

                if (user.kythiaBank >= penalty) {
                    user.kythiaBank -= penalty;
                    target.kythiaBank += penalty;
                    user.changed('kythiaBank', true);
                    target.changed('kythiaBank', true);
                    await user.saveAndUpdateCache('userId');
                    await target.saveAndUpdateCache('userId');
                }

                // Set lastHack even if failed
                user.lastHack = Date.now();
                user.changed('lastHack', true);
                await user.saveAndUpdateCache('userId');

                const failureEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setDescription(
                        await t(interaction, 'economy_hack_hack_failure', {
                            target: targetUser.username,
                            penalty,
                        })
                    )
                    .setFooter(await embedFooter(interaction));

                await interaction.editReply({ embeds: [failureEmbed] });
            }
        }, 5000);
    },
};