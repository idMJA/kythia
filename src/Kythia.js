/**
 * 🤖 Main Kythia Entrypoint
 *
 * @file src/Kythia.js
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.5
 *
 * @description
 * This file contains the main Bot class - acting as an orchestrator (CEO) that
 * initializes and coordinates specialized managers for different responsibilities.
 *
 * ✨ Core Features:
 * - Orchestrates AddonManager, InteractionManager, EventManager, and ShutdownManager
 * - REST API setup for command deployment
 * - Integration with client and database
 * - Manages dependencies through container pattern
 */

const { REST, Routes, Collection } = require('discord.js');
const KythiaModel = require('./database/KythiaModel');
const KythiaORM = require('./database/KythiaORM');
const KythiaClient = require('./KythiaClient');
const loadFonts = require('./utils/fonts');
const Sentry = require('@sentry/node');
const figlet = require('figlet');

// Import specialized managers
const InteractionManager = require('./managers/InteractionManager');
const ShutdownManager = require('./managers/ShutdownManager');
const AddonManager = require('./managers/AddonManager');
const EventManager = require('./managers/EventManager');

class Kythia {
    /**
     * 🏗️ Kythia Constructor
     * Initializes the Discord client, REST API, and dependency container.
     * Sets up manager instances (but doesn't start them yet).
     */
    constructor({ config, logger, translator, sentry, models, helpers, utils }) {
        const missingDeps = [];
        if (!config) missingDeps.push('config');
        if (!logger) missingDeps.push('logger');
        if (!translator) {
            missingDeps.push('translator');
        } else {
            if (!translator.t) missingDeps.push('translator.t');
            if (!translator.loadLocales) missingDeps.push('translator.loadLocales');
        }
        if (missingDeps.length > 0) {
            console.error(`FATAL: Missing required dependencies: ${missingDeps.join(', ')}.`);
            process.exit(1);
        }
        this.kythiaConfig = config;

        this.client = KythiaClient();
        this.client.commands = new Collection();
        this.rest = new REST({ version: '10' }).setToken(this.kythiaConfig.bot.token);

        this.models = models;
        this.helpers = helpers;
        this.utils = utils;

        this.logger = logger;
        this.translator = translator;
        this.container = {
            client: this.client,
            sequelize: null,
            logger: this.logger,
            t: this.translator.t,
            redis: null,
            kythiaConfig: this.kythiaConfig,
            translator: this.translator,

            models: this.models,
            helpers: this.helpers,
        };

        this.client.container = this.container;
        this.client.cooldowns = new Collection();

        this.dbReadyHooks = [];
        this.clientReadyHooks = [];

        // Initialize manager references (will be instantiated in start())
        this.addonManager = null;
        this.interactionManager = null;
        this.eventManager = null;
        this.shutdownManager = null;
    }

    /**
     * 🔍 Check Required Config
     * Checks if all required configurations are set.
     * Throws an error if any required config is missing.
     */
    _checkRequiredConfig() {
        const requiredConfig = [
            ['bot', 'token'],
            ['bot', 'clientId'],
            ['bot', 'clientSecret'],
            ['db', 'driver'],
            ['db', 'host'],
            ['db', 'port'],
            ['db', 'name'],
            ['db', 'user'],
        ];

        const missingConfigs = [];

        for (const pathArr of requiredConfig) {
            let value = this.kythiaConfig;
            for (const key of pathArr) {
                value = value?.[key];
            }

            if (value === undefined || value === null || value === '') {
                missingConfigs.push(pathArr.join('.'));
            }
        }

        if (missingConfigs.length > 0) {
            this.logger.error('❌ Required configurations are not set:');
            for (const missing of missingConfigs) {
                this.logger.error(`   - ${missing}`);
            }
            process.exit(1);
        }

        this.logger.info('✔️  All required configurations are set');
    }

    /**
     * 🔘 Register Button Handler
     * Delegates to AddonManager
     * @param {string} customId - The customId of the button
     * @param {Function} handler - The handler function to execute
     */
    registerButtonHandler(customId, handler) {
        if (this.addonManager) {
            this.addonManager.registerButtonHandler(customId, handler);
        }
    }

    /**
     * 📝 Register Modal Handler
     * Delegates to AddonManager
     * @param {string} customIdPrefix - The prefix of the modal customId
     * @param {Function} handler - The handler function to execute
     */
    registerModalHandler(customIdPrefix, handler) {
        if (this.addonManager) {
            this.addonManager.registerModalHandler(customIdPrefix, handler);
        }
    }

    /**
     * 🛡️ Validate License (Stub)
     * Placeholder for license validation logic for addons.
     * @param {string} licenseKey - The license key to validate
     * @param {string} addonName - The name of the addon
     * @returns {Promise<boolean>} Always returns true (stub)
     */
    async _validateLicense(licenseKey, addonName) {
        return true;
    }

    /**
     * 🚀 Deploy Commands to Discord
     * Deploys all registered slash commands to Discord using the REST API.
     * @param {Array} commands - Array of command data to deploy
     */
    async _deployCommands(commands) {
        if (!commands || commands.length === 0) {
            this.logger.info('No commands to deploy.');
            return;
        }
        try {
            const { slash, user, message } = this._getCommandCounts(commands);
            const clientId = this.kythiaConfig.bot.clientId;
            const devGuildId = this.kythiaConfig.bot.devGuildId;

            let deployType = '';
            if (this.kythiaConfig.env == 'dev' || this.kythiaConfig.env == 'development') {
                if (!devGuildId) {
                    this.logger.warn('⚠️ devGuildId not set in config. Skipping guild command deployment.');
                    return;
                }
                this.logger.info(`🟠 Deploying to GUILD ${devGuildId}...`);
                await this.rest.put(Routes.applicationGuildCommands(clientId, devGuildId), { body: commands });
                this.logger.info('✅ Guild commands deployed instantly!');
                deployType = `Guild (${devGuildId})`;
            } else {
                this.logger.info(`🟢 Deploying globally...`);
                await this.rest.put(Routes.applicationCommands(clientId), { body: commands });
                this.logger.info('✅ Global commands deployed successfully!');
                if (devGuildId) {
                    this.logger.info(`🧹 Clearing old commands from dev guild: ${devGuildId}...`);
                    try {
                        await this.rest.put(Routes.applicationGuildCommands(clientId, devGuildId), { body: [] });
                        this.logger.info('✅ Dev guild commands cleared successfully.');
                    } catch (err) {
                        this.logger.warn(`⚠️ Could not clear dev guild commands (maybe it was already clean): ${err.message}`);
                    }
                }
                deployType = 'Global';
            }

            this.logger.info(`⭕ All Slash Commands: ${commands.length}`);
            this.logger.info(`⭕ Top Level Slash Commands: ${slash}`);
            this.logger.info(`⭕ User Context Menu: ${user}`);
            this.logger.info(`⭕ Message Context Menu: ${message}`);
            this.logger.info('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬');
        } catch (err) {
            this.logger.error('❌ Failed to deploy slash commands:', err);
        }
    }

    /**
     * 🧮 Count command types from JSON array
     * @param {Array} commandJsonArray - Array command data to be deployed
     * @returns {object} - Object containing counts { slash, user, message }
     * @private
     */
    _getCommandCounts(commandJsonArray) {
        const counts = { slash: 0, user: 0, message: 0 };

        if (!Array.isArray(commandJsonArray)) {
            this.logger.warn('commandJsonArray is not iterable. Returning zero counts.');
            return counts;
        }

        for (const cmd of commandJsonArray) {
            switch (cmd?.type) {
                case 1:
                case undefined:
                    counts.slash++;
                    break;
                case 2:
                    counts.user++;
                    break;
                case 3:
                    counts.message++;
                    break;
            }
        }
        return counts;
    }

    /**
     * Adds a callback to be executed when the database is ready.
     * The callback will be executed after all database models have been synchronized.
     * @param {function} callback - Callback to be executed when the database is ready
     */
    addDbReadyHook(callback) {
        this.dbReadyHooks.push(callback);
    }

    /**
     * Adds a callback to be executed when the client is ready.
     * @param {function} callback - Callback to be executed when the client is ready
     */
    addClientReadyHook(callback) {
        this.clientReadyHooks.push(callback);
    }

    /**
     * 🌸 Start the Kythia Bot
     * Main orchestration method that:
     * 1. Initializes Redis cache
     * 2. Creates and starts all managers
     * 3. Loads addons via AddonManager
     * 4. Initializes database
     * 5. Sets up interaction and event handlers
     * 6. Deploys commands
     * 7. Logs in to Discord
     */
    async start() {
        const version = require('../package.json').version;
        const clc = require('cli-color');
        const figletText = (text, opts) =>
            new Promise((resolve, reject) => {
                figlet.text(text, opts, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });

        try {
            // Render figlet banner
            const data = await figletText('KYTHIA', {
                font: 'ANSI Shadow',
                horizontalLayout: 'full',
                verticalLayout: 'full',
            });

            // Info lines
            const infoLines = [
                clc.cyan('Created by kenndeclouv'),
                clc.cyan('Discord Support: ') + clc.underline('https://dsc.gg/kythia'),
                clc.cyan('Official Documentation: ') + clc.underline('https://kythia.my.id/commands'),
                '',
                clc.cyanBright(`Kythia version: ${version}`),
                '',
                clc.yellowBright('Respect my work by not removing the credit'),
            ];

            // Calculate border width
            const rawInfoLines = infoLines.map((line) => clc.strip(line));
            const infoMaxLen = Math.max(...rawInfoLines.map((l) => l.length));
            const pad = 8;
            const borderWidth = infoMaxLen + pad * 2;
            const borderChar = clc.cyanBright('═');
            const sideChar = clc.cyanBright('║');
            const topBorder = clc.cyanBright('╔' + borderChar.repeat(borderWidth) + '╗');
            const bottomBorder = clc.cyanBright('╚' + borderChar.repeat(borderWidth) + '╝');
            const emptyLine = sideChar + ' '.repeat(borderWidth) + sideChar;

            // Center figlet lines
            const figletLines = data.split('\n');
            const centeredFigletInBorder = figletLines
                .map((line) => {
                    const rawLen = clc.strip(line).length;
                    const spaces = ' '.repeat(Math.max(0, Math.floor((borderWidth - rawLen) / 2)));
                    return sideChar + spaces + clc.cyanBright(line) + ' '.repeat(borderWidth - spaces.length - rawLen) + sideChar;
                })
                .join('\n');

            // Center info lines
            const centeredInfo = infoLines
                .map((line, idx) => {
                    const raw = rawInfoLines[idx];
                    const spaces = ' '.repeat(Math.floor((borderWidth - raw.length) / 2));
                    return sideChar + spaces + line + ' '.repeat(borderWidth - spaces.length - raw.length) + sideChar;
                })
                .join('\n');

            // Print banner
            console.log('\n' + topBorder);
            console.log(emptyLine);
            console.log(centeredFigletInBorder);
            console.log(emptyLine);
            console.log(centeredInfo);
            console.log(emptyLine);
            console.log(bottomBorder + '\n');
        } catch (err) {
            this.logger.error('❌ Failed to render figlet banner:', err);
        }

        this.logger.info('🚀 Starting kythia...');

        // Initialize Sentry
        if (this.kythiaConfig.sentry.dsn) {
            Sentry.init({
                dsn: this.kythiaConfig.sentry.dsn,
                tracesSampleRate: 1.0,
                profilesSampleRate: 1.0,
            });
            this.logger.info('✔️  Sentry Error Tracking is ACTIVE');
        } else {
            this.logger.warn('🟠 Sentry DSN not found in config. Error tracking is INACTIVE.');
        }

        this._checkRequiredConfig();

        try {
            const shouldDeploy = process.argv.includes('--deploy');

            // Load locales & fonts
            this.logger.info('▬▬▬▬▬▬▬▬▬▬▬[ Load Locales & Fonts ]▬▬▬▬▬▬▬▬▬▬▬');
            this.translator.loadLocales();
            loadFonts(this.logger);

            // 1. Initialize Redis cache
            this.logger.info('▬▬▬▬▬▬▬▬▬▬▬▬▬▬[ Initialize Cache ]▬▬▬▬▬▬▬▬▬▬▬▬▬▬');
            this.container.redis = KythiaModel.initialize(this.kythiaConfig.db.redis);

            // 2. Create AddonManager and load addons
            this.logger.info('▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬[ Kythia Addons ]▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬');
            this.addonManager = new AddonManager({ client: this.client, container: this.container });
            const allCommands = await this.addonManager.loadAddons(this);

            // 3. Initialize database (will use dbReadyHooks that were populated during addon loading)
            this.logger.info('▬▬▬▬▬▬▬▬▬▬▬▬▬▬[ Load KythiaORM ]▬▬▬▬▬▬▬▬▬▬▬▬▬▬');
            const sequelize = await KythiaORM(this);
            this.container.sequelize = sequelize;

            // 5. Create and initialize EventManager
            const handlers = this.addonManager.getHandlers();
            this.eventManager = new EventManager({ client: this.client, container: this.container, eventHandlers: handlers.eventHandlers });
            this.eventManager.initialize();

            // 6. Create and initialize InteractionManager
            this.interactionManager = new InteractionManager({ client: this.client, container: this.container, handlers: handlers });
            this.interactionManager.initialize();

            // 7. Deploy commands if requested
            this.logger.info('▬▬▬▬▬▬▬▬▬▬▬▬▬[ Deploy Commands ]▬▬▬▬▬▬▬▬▬▬▬▬▬');
            if (shouldDeploy) {
                await this._deployCommands(allCommands);
            } else {
                this.logger.info('⏭️  Skipping command deployment. Use --deploy flag to force update.');
            }

            // 8. Create and initialize ShutdownManager
            this.shutdownManager = new ShutdownManager({ client: this.client, container: this.container });
            this.shutdownManager.initialize();

            this.logger.info('▬▬▬▬▬▬▬▬▬▬▬[ Systems Initializing ]▬▬▬▬▬▬▬▬▬▬▬▬');

            // 9. Set up client ready handler
            this.client.once('clientReady', async (c) => {
                this.logger.info(`🌸 Logged in as ${this.client.user.tag}`);
                this.logger.info(`🚀 Executing ${this.clientReadyHooks.length} client-ready hooks...`);
                for (const hook of this.clientReadyHooks) {
                    try {
                        await hook(c);
                    } catch (error) {
                        this.logger.error('Failed to execute a client-ready hook:', error);
                    }
                }
            });

            // 10. Login to Discord
            await this.client.login(this.kythiaConfig.bot.token);
        } catch (error) {
            this.logger.error('❌ Kythia initialization failed:', error);
            if (this.kythiaConfig.sentry.dsn) {
                Sentry.captureException(error);
            }
            process.exit(1);
        }
    }
}

module.exports = Kythia;
