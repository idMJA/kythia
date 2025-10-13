/**
 * @namespace: addons/economy/commands/rob.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.1
 */
const { embedFooter } = require('@utils/discord');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const KythiaUser = require('@coreModels/KythiaUser');
const Inventory = require('@coreModels/Inventory');
const { checkCooldown } = require('@utils/time');
const { t } = require('@utils/translator');
const BankManager = require('../helpers/bankManager');

module.exports = {
    subcommand: true,
    data: (subcommand) =>
        subcommand
            .setName('rob')
            .setDescription('💵 Try to rob money from another user.')
            .addUserOption((option) => option.setName('target').setDescription('The user you want to rob').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('target');
        if (targetUser.id === interaction.user.id) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(await t(interaction, 'economy_rob_rob_cannot_rob_self'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        const user = await KythiaUser.getCache({ userId: interaction.user.id });
        if (!user) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(await t(interaction, 'economy_withdraw_no_account_desc'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        const target = await KythiaUser.getCache({ userId: targetUser.id });
        if (!target) {
            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setDescription(await t(interaction, 'economy_rob_rob_target_no_account_desc'))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        const cooldown = checkCooldown(user.lastRob, kythia.addons.economy.robCooldown || 10800); // Default to 3 hours

        if (cooldown.remaining) {
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setDescription(await t(interaction, 'economy_rob_rob_cooldown', { time: cooldown.time }))
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter(await embedFooter(interaction));
            return interaction.editReply({ embeds: [embed] });
        }

        const guard = await Inventory.findOne({ where: { userId: target.userId, itemName: '🚓 Guard' } });
        let poison = null;
        if (!guard) {
            poison = await Inventory.findOne({ where: { userId: target.userId, itemName: '🧪 Poison' } });
        }

        // ==== EDITED LOGIC FOR BANK INFLUENCE ON SUCCESS CHANCE ====
        const userBank = BankManager.getBank(user.bankType);
        let success = false;
        if (guard) {
            success = false;
            await guard.destroy(); // Destroy the guard item after use
        } else if (poison) {
            // Poison always remains 10%
            success = Math.random() < 0.1;
        } else {
            // Use base + bank success chance for normal rob attempt
            let baseSuccessChance = 0.3; // 30%
            // Tambahkan bonus dari bank
            const successBonus = userBank.robSuccessBonusPercent / 100; // misal 15% jadi 0.15
            baseSuccessChance += successBonus;
            success = Math.random() < baseSuccessChance;
        }
        // ==== END OF EDITED LOGIC ====

        const baseRobAmount = Math.floor(Math.random() * 201) + 50;
        // Apply bank rob success bonus
        const robSuccessBonusPercent = userBank.robSuccessBonusPercent;
        const robBonus = Math.floor(baseRobAmount * (robSuccessBonusPercent / 100));
        const robAmount = baseRobAmount + robBonus;

        if (success) {
            // Successful rob
            if (target.kythiaCoin < robAmount) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(await t(interaction, 'economy_rob_rob_target_not_enough_money'))
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter(await embedFooter(interaction));
                return interaction.editReply({ embeds: [embed] });
            }

            user.kythiaCoin += robAmount;
            target.kythiaCoin -= robAmount;
            user.lastRob = new Date();
            user.changed('kythiaCoin', true);
            target.changed('kythiaCoin', true);
            await user.saveAndUpdateCache('userId');
            await target.saveAndUpdateCache('userId');

            const embed = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setDescription(
                    await t(interaction, 'economy_rob_rob_success', {
                        amount: robAmount,
                        target: targetUser.username,
                    })
                )
                .setFooter(await embedFooter(interaction));
            await interaction.editReply({ embeds: [embed] });

            const embedToTarget = new EmbedBuilder()
                .setColor('Red')
                .setThumbnail(interaction.user.displayAvatarURL())
                .setDescription(
                    await t(interaction, 'economy_rob_rob_success_dm', {
                        robber: interaction.user.username,
                        amount: robAmount,
                    })
                )
                .setFooter(await embedFooter(interaction));
            await targetUser.send({ embeds: [embedToTarget] });
        } else {
            // Failed rob, pay the target with penalty multiplier
            const robPenaltyMultiplier = userBank ? userBank.robPenaltyMultiplier : 1;
            const basePenalty = Math.floor(robAmount * robPenaltyMultiplier);

            if (user.kythiaCoin < basePenalty && !poison) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(await t(interaction, 'economy_rob_rob_user_not_enough_money_fail'))
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter(await embedFooter(interaction));
                return interaction.editReply({ embeds: [embed] });
            }
            let penalty = basePenalty;
            if (poison) {
                penalty = user.kythiaCoin;
                user.kythiaCoin -= penalty;
                target.kythiaCoin += penalty;
                await poison.destroy(); // Destroy poison item after use
            } else {
                user.kythiaCoin -= basePenalty;
                target.kythiaCoin += basePenalty;
            }

            user.lastRob = new Date();
            user.changed('kythiaCoin', true);
            target.changed('kythiaCoin', true);
            await user.saveAndUpdateCache('userId');
            await target.saveAndUpdateCache('userId');

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setThumbnail(interaction.user.displayAvatarURL())
                .setDescription(
                    await t(interaction, 'economy_rob_rob_fail', {
                        target: targetUser.username,
                        penalty: poison ? await t(interaction, 'economy_rob_rob_fail_penalty_all') : `${robAmount} kythia coin`,
                        guard: guard ? await t(interaction, 'economy_rob_rob_fail_guard') : '',
                        poison: poison ? await t(interaction, 'economy_rob_rob_fail_poison') : '',
                    })
                )
                .setFooter(await embedFooter(interaction));
            await interaction.editReply({ embeds: [embed] });

            const embedToTarget = new EmbedBuilder()
                .setColor(kythia.bot.color)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setDescription(
                    await t(interaction, 'economy_rob_rob_fail_dm', {
                        robber: interaction.user.username,
                        amount: robAmount,
                        penalty: poison ? penalty : robAmount,
                        guard: guard ? await t(interaction, 'economy_rob_rob_fail_guard_dm') : '',
                        poison: poison ? await t(interaction, 'economy_rob_rob_fail_poison_dm') : '',
                    })
                )
                .setFooter(await embedFooter(interaction));
            await targetUser.send({ embeds: [embedToTarget] });
        }
    },
};
