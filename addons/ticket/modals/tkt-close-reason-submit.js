/**
 * @namespace: addons/ticket/modals/tkt-submit-close-reason.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @version: 1.0.0
 */
const { closeTicket } = require('../helpers');
const { MessageFlags } = require('discord.js');

module.exports = {
    execute: async (interaction, container) => {
        const { t, helpers } = container;
        const { simpleContainer } = helpers.discord;

        try {
            // 1. Defer modalnya dulu, karena helper closeTicket butuh waktu
            const thinkingDesc = await t(interaction, 'ticket.close.thinking');
            await interaction.reply({
                content: thinkingDesc,
                ephemeral: true,
            });

            const reason = interaction.fields.getTextInputValue('reason');

            await closeTicket(interaction, container, reason);
        } catch (error) {
            console.error('Error submitting close w/ reason modal:', error);
            const descError = await t(interaction, 'ticket.errors.close_failed');
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    components: await simpleContainer(interaction, descError, { color: 'Red' }),
                    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                });
            }
        }
    },
};
