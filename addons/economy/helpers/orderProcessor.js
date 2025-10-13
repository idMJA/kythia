/**
 * @namespace: addons/economy/helpers/orderProcessor.js
 * @type: Helper
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.3
 */
const { Op } = require('sequelize');
const KythiaUser = require('@coreModels/KythiaUser');
const MarketOrder = require('../database/models/MarketOrder');
const MarketPortfolio = require('../database/models/MarketPortfolio');
const MarketTransaction = require('../database/models/MarketTransaction');
const { getMarketData } = require('./market');
const logger = require('@utils/logger');
const cron = require('node-cron');

async function processOrders() {
    logger.info('Processing market orders...');
    try {
        const marketData = await getMarketData();
        const openOrders = await MarketOrder.getAllCache({ status: 'open' });

        for (const order of openOrders) {
            const assetData = marketData[order.assetId];
            if (!assetData) continue;

            const currentPrice = assetData.usd;
            let shouldExecute = false;

            if (order.type === 'limit' && order.side === 'buy' && currentPrice <= order.price) {
                shouldExecute = true;
            } else if (order.type === 'limit' && order.side === 'sell' && currentPrice >= order.price) {
                shouldExecute = true;
            } else if (order.type === 'stoploss' && order.side === 'sell' && currentPrice <= order.price) {
                shouldExecute = true;
            }

            if (shouldExecute) {
                const user = await KythiaUser.getCache({ userId: order.userId });
                if (!user) continue;

                if (order.side === 'buy') {
                    const totalCost = order.quantity * order.price;
                    // No need to check or deduct kythiaCoin here, as it was already deducted when the order was placed.

                    const portfolio = await MarketPortfolio.getCache({ userId: order.userId, assetId: order.assetId });
                    if (portfolio) {
                        const newQuantity = portfolio.quantity + order.quantity;
                        const newAvgPrice = (portfolio.quantity * portfolio.avgBuyPrice + order.quantity * order.price) / newQuantity;
                        portfolio.quantity = newQuantity;
                        portfolio.avgBuyPrice = newAvgPrice;
                        await portfolio.save();
                    } else {
                        await MarketPortfolio.create({
                            userId: order.userId,
                            assetId: order.assetId,
                            quantity: order.quantity,
                            avgBuyPrice: order.price,
                        });
                    }

                    order.status = 'filled';
                    await MarketTransaction.create({
                        userId: order.userId,
                        assetId: order.assetId,
                        type: 'buy',
                        quantity: order.quantity,
                        price: order.price,
                    });
                } else {
                    // sell
                    // Assets were already deducted. We just need to give the user the coins.
                    const totalReceived = order.quantity * currentPrice;
                    user.kythiaCoin += totalReceived;

                    order.status = 'filled';
                    await MarketTransaction.create({
                        userId: order.userId,
                        assetId: order.assetId,
                        type: 'sell',
                        quantity: order.quantity,
                        price: currentPrice,
                    });
                }
                await user.save();
                await order.save();
            }
        }
    } catch (error) {
        logger.error('Error processing market orders:', error);
    }
}

/**
 * Initialize scheduled market order processing.
 * Mimics the style used in @ai/tasks/dailyGreeter.js.
 * @param {Object} [options] Optional scheduling options (e.g. custom cron, timezone).
 */
function initializeOrderProcessing(options = {}) {
    const schedule =
        typeof kythia !== 'undefined' && kythia.addons && kythia.addons.economy && kythia.addons.economy.orderProcessorSchedule
            ? kythia.addons.economy.orderProcessorSchedule
            : '*/5 * * * *';

    cron.schedule(
        schedule,
        async () => {
            await processOrders();
        },
        {
            timezone: typeof kythia !== 'undefined' && kythia.bot && kythia.bot.timezone ? kythia.bot.timezone : undefined,
            ...options,
        }
    );
}

module.exports = { processOrders, initializeOrderProcessing };
