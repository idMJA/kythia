# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.9.9-beta-rc.3](https://github.com/kythia/kythia/compare/v0.9.9-beta-rc.2...v0.9.9-beta-rc.3) (2025-10-13)


### 🔨 Fixed

* changing example.env and example.kythia.config.js to main as is ([2e995fa](https://github.com/kythia/kythia/commit/2e995fa37a75dae702f6439eb6383c803e25b180))
* update start script in package.json to include --deploy flag for proper deployment ([5302312](https://github.com/kythia/kythia/commit/530231261a017574c02cbfd3e69a4b1276642f48))


### 🔧 Changed

* changing pet addon to follow kythia user and coin ([3289cfb](https://github.com/kythia/kythia/commit/3289cfb7d7540e627a2c3d28f72d8591fbe99486))
* remove cooldown settings from various economy commands and update language strings to use "kythia coin" instead of "cash" ([f964b43](https://github.com/kythia/kythia/commit/f964b43c2535aea7b7970e6aafc037340a13f6ab))
* update dashboard routes to improve settings handling and enhance feature toggles; remove deprecated routes and streamline automod settings ([4947de9](https://github.com/kythia/kythia/commit/4947de944b5fa515658ea4dee2283571b4881bf1))
* update navbar and sidebar icons for improved UI consistency; ([0f6a530](https://github.com/kythia/kythia/commit/0f6a530d8ab239852cf3ddb3189c8f9d5e469166))
* update permissions for 'say' command and enhance landing page content; remove deprecated mobile navigation and improve layout styling ([f5fd57e](https://github.com/kythia/kythia/commit/f5fd57eef980233c8545ea3073c4a024db2374e4))


### ✨ Added

* (api) Enhance Top.gg webhook handling with user account prompts and rewards ([3b715e0](https://github.com/kythia/kythia/commit/3b715e0159f77e1fd2c807bbe85982dde953eeb8))
* (economy) Enhance bank command information, functionality and user experience ([0c2bff8](https://github.com/kythia/kythia/commit/0c2bff80280e6e3777c3f5951f8c36871104901a))
* add GuildMemberRemove event handler to track user departures and send goodbye messages with customizable banners (not tested yet) ([6f84826](https://github.com/kythia/kythia/commit/6f8482666e417940c5cc9c191115d3f3aaee1a17))
* Add new market-related language strings for asset transactions in economy addon ([82acfc9](https://github.com/kythia/kythia/commit/82acfc991e15c7eb5a52354ca651dc2bce5f55ca))
* **economy:** Enhance economy commands with bank type benefits ([eb22c56](https://github.com/kythia/kythia/commit/eb22c5661e30d3581fd5deb1ddbd662bfa0d0359))
* **economy:** Refactor economy commands to use a global user model ([6dfb60b](https://github.com/kythia/kythia/commit/6dfb60b5899bd6b6e9cd2721748d6325186417e2))
* **economy:** Update economy commands to use kythiaCoin and kythiaBank ([e71b40e](https://github.com/kythia/kythia/commit/e71b40e7cf7da35d210b7b85a2fe214be5520a76))
* implement Kythia team management command with add, delete, and list functionalities; enhance error handling and logging ([ee3f94d](https://github.com/kythia/kythia/commit/ee3f94dea4065fa8172b19c9cecde6c35416c5cd))

### 0.9.9-beta-rc.2 (2025-10-09)


### 🔨 Fixed

* forEach is not a function on dashboard addon ([20f3ece](https://github.com/kythia/kythia/commit/20f3ecef6b8a707c6a8477048b431dc359fecd2a))
* safely resolve guild owner's username and update webhook description ([2cba2fb](https://github.com/kythia/kythia/commit/2cba2fba2d0249e1caa2057ba6b148e31a5c34c0))


### ✨ Added

* add Kythia CLI documentation and enhance server settings handling; normalize settings structure and improve error logging ([0c288fa](https://github.com/kythia/kythia/commit/0c288fa8fb656c1a6af8fbe15f57fe14120f91e1))
* add localization support for adventure commands; enhance command descriptions  and names in multiple languages in adventure addons ([42794e6](https://github.com/kythia/kythia/commit/42794e6711dbd5446e761dd33674221e8c417e5a))
* implement pagination for settings embed; enhance user interaction with navigation buttons for multi-page descriptions ([6245ce2](https://github.com/kythia/kythia/commit/6245ce242c1660413d194c879b26e78b9f649dd7))


### 🔧 Changed

* enhance Kythia initialization in Kythia.js and update intents in KythiaClient.js ([053fd3d](https://github.com/kythia/kythia/commit/053fd3d80095015ecd4fc05ef2568332eb103e3e))
* enhance various command structures and improve database models across multiple addons; streamline event handling and optimize performance; v0.9.9-beta-rc1 ([59f9140](https://github.com/kythia/kythia/commit/59f9140a82f301ce0fd7ed27221ab388ab137824))
* optimize KythiaClient configuration; streamline intents and partials setup, and enhance cache and sweeper settings ([5d9bbc2](https://github.com/kythia/kythia/commit/5d9bbc20bbf45a25b2bde0f64a1bd4245ee0eaa3))
* owner id now can more than 1 ([3b40662](https://github.com/kythia/kythia/commit/3b40662fecb5367a6d1a6b87775ebb4cc18fb2d0))
* streamline ping and stats commands; enhance Lavalink node ping handling and add Git commit ID to stats embed ([5660451](https://github.com/kythia/kythia/commit/566045105722249eb7d89900e022feebe21026b7))
* update bot owner configuration to support multiple IDs and names; enhance AI translation command with improved error handling and token management ([9c3ccd9](https://github.com/kythia/kythia/commit/9c3ccd9b08d841820b55d6e0ac677d4aab534008))

### 0.9.9-beta-rc.1 (2025-10-09)


### ✨ Added 

#### ⚔️ Adventure
- **battle:** Engage in battles with creatures.
- **inventory:** View your adventure inventory.
- **recall:** Recall your character.
- **shop:** Access the adventure shop.
- **start:** Begin your adventure.
- **stats:** Check your adventure statistics.

#### 🤖 AI
- **ai:** Interact with the AI.
- **translate:** Translate text to other languages.

#### ✅ Checklist
- **personal:** Manage your personal checklist.
- **server:** Manage the server's checklist.

#### ⚙️ CORE
- **autosetup:** Automatically configure server settings.
- **embed:** Create and manage embeds.
- **moderation:** Access moderation commands.
- **premium:** Manage premium features.
- **setting:** Configure bot settings.
- **tools:** Access various tools.
- **utils:** Access utility commands.

#### 💰 Economy
- **account:** Manage your economy account.
- **bank:** Interact with your bank account.
- **beg:** Beg for some cash.
- **cash:** Check your cash balance.
- **coinflip:** Gamble your cash in a coinflip.
- **daily:** Claim your daily reward.
- **deposit:** Deposit cash into your bank.
- **give:** Give cash to another user.
- **hack:** Attempt to hack for cash.
- **inventory:** View your economy inventory.
- **lootbox:** Open a lootbox.
- **profile:** View your economy profile.
- **rob:** Rob another user.
- **shop:** Access the economy shop.
- **slots:** Play the slot machine.
- **transfer:** Transfer cash to another user.
- **withdraw:** Withdraw cash from your bank.
- **work:** Work for some cash.

#### 🎉 Fun
- **8ball:** Ask the magic 8ball a question.
- **guessnumber:** Play a number guessing game.
- **uno:** Play a game of Uno.
- **tictactoe:** Play a game of Tic Tac Toe.
- **wordle:** Play a game of Wordle.

#### 🎁 Giveaway
- **giveaway:** Create and manage giveaways.

#### 💌 Invite
- **invite:** Get the bot's invite link.

#### 📈 Leveling
- **add:** Add experience to a user.
- **leaderboard:** View the leveling leaderboard.
- **profile:** View your leveling profile.
- **set:** Set a user's level.
- **xp-add:** Add experience points to a user.
- **xp-set:** Set a user's experience points.

#### 🎶 Music
- **music:** Control music playback.
- **reloadnode:** Reload the music node.

#### 🐾 Pet
- **admin:** Pet administration commands.
- **adopt:** Adopt a new pet.
- **editname:** Change your pet's name.
- **feed:** Feed your pet.
- **gacha:** Try your luck with the pet gacha.
- **info:** Get information about your pet.
- **leaderboard:** View the pet leaderboard.
- **play:** Play with your pet.
- **sell:** Sell your pet.
- **use:** Use a pet-related item.

#### ⚙️ Server
- **server:** Manage server settings.

#### 🔥 Streak
- **streak:** Manage your streaks.
