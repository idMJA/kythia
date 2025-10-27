/**
 * 🚀 Entry Point: Kythia Discord Bot
 *
 * @file bot.js
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.5
 *
 * @description
 * This is the worker entry point for the Kythia Discord bot. It sets up the environment,
 * loads all required modules, and starts the bot instance.
 *
 * ---
 * 📦 Dependencies:
 * - module-alias: Enables custom module path aliases for cleaner imports.
 * - dotenv: Loads environment variables from a .env file for configuration.
 * - ./src/Kythia: The main Kythia class that encapsulates all bot logic and startup routines.
 *
 * ---
 * 📝 Main Functions & Their Roles:
 *
 * 1. 🏷️ require('module-alias/register')
 *    - Registers custom module aliases as defined in package.json (`_moduleAliases`).
 *    - Allows you to use `@src`, `@utils`, etc. in your imports for better code organization.
 *    - Should be called before any other imports that use aliases.
 *
 * 2. 🤖 const Kythia = require('./src/Kythia')
 *    - Imports the main Kythia class, which contains all logic for connecting to Discord,
 *      registering commands, handling events, and managing features.
 *
 * 3. 🛠️ const kythiaInstance = new Kythia()
 *    - Instantiates the Kythia class, preparing the kythia for startup.
 *    - All configuration and dependency injection happens here.
 *
 * 4. 🚦 kythiaInstance.start()
 *    - Boots up the kythia: logs in to Discord, loads commands, sets up event listeners, etc.
 *    - This is the main trigger to bring the kythia online and operational.
 *
 * ---
 * 🛡️ Safety:
 * - All environment variables must be set in `.env` before starting.
 * - If you add new aliases, update both `package.json` and ensure this file loads them first.
 */

// require('dotenv').config();
// require('./kythia.config.js');

// require('module-alias/register');

// const Kythia = require('./src/Kythia');

// const kythiaInstance = new Kythia();
// kythiaInstance.start();
// require('dotenv').config();
// const kythiaConfig = require('./kythia.config.js'); //
// require('module-alias/register');

// const logger = require('@coreHelpers/logger');
// const translator = require('@coreHelpers/translator');

// const Kythia = require('./src/Kythia');

// const dependencies = {
//     config: kythiaConfig,
//     logger: logger,
//     translator: translator,
// };

// try {
//     const kythiaInstance = new Kythia(dependencies);

//     kythiaInstance.start();
// } catch (error) {
//     const log = logger || console;
//     log.error('🔥 FATAL ERROR during initialization:', error);
//     process.exit(1);
// }
require('dotenv').config();
const kythiaConfig = require('./kythia.config.js'); // <-- Kita ubah ini dikit
require('module-alias/register');

// 2. Siapkan (Load) Dependensi
const logger = require('@coreHelpers/logger');
const translator = require('@coreHelpers/translator');
const { isTeam, isOwner } = require('@coreHelpers/discord');
const ServerSetting = require('@coreModels/ServerSetting');
const KythiaVoter = require('@coreModels/KythiaVoter');
// 3. Load Kelas Utama
const Kythia = require('./src/Kythia');

const dependencies = {
    config: kythiaConfig,
    logger: logger,
    translator: translator,
    models: { ServerSetting, KythiaVoter },
    helpers: {
        discord: { isTeam, isOwner },
    },
};

// 5. Jalankan Aplikasi
try {
    const kythiaInstance = new Kythia(dependencies);
    kythiaInstance.start();
} catch (error) {
    const log = logger || console;
    log.error('🔥 FATAL ERROR during initialization:', error);
    process.exit(1);
}
