/**
 * @namespace: addons/ai/register.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.3
 */

// addons/dashboard/register.js

const logger = require('@utils/logger');
const { initializeOrderProcessing } = require('./helpers/orderProcessor');
module.exports = {
    async initialize(bot) {
        const summery = [];
        initializeOrderProcessing();
        summery.push('   └─ Task: Order processing');
        return summery;
    },
};
