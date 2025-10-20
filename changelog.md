# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.9.9-beta-rc.5](https://github.com/kythia/kythia/compare/v0.9.9-beta-rc.4...v0.9.9-beta-rc.5) (2025-10-20)


### 🔧 Changed

* make adventure commands globally ([1e791a7](https://github.com/kythia/kythia/commit/1e791a741bb172b6f1d110a581bcc7a242d7a7ad))
* rename User and Inventory models for consistency and update battle command logic to enhance item usage and user stats management ([5006259](https://github.com/kythia/kythia/commit/500625967bf17dfc124a78f3e48dd15d52bb568c))
* update marriage handling to use getAllCache for improved data retrieval and error handling ([9477bbd](https://github.com/kythia/kythia/commit/9477bbdd07e22f44cfb1c9f9bdeeb6b3069b179e))


### ✨ Added

* add message for no listeners in voice channel to music manager ([1ef6997](https://github.com/kythia/kythia/commit/1ef6997963514a454d6f1fa689cb4cff573f7e3f))
* add Redis ping functionality to the ping command and improve command alias handling ([7358709](https://github.com/kythia/kythia/commit/73587096c55b1163b5bb264306bdad6488b824fa))
* add short message threshold to automod settings and improve message handling efficiency ([c6f872e](https://github.com/kythia/kythia/commit/c6f872efecc04356ab84989ea788ad3c7dc75ea6))
* free image host like imgur, catbox etc ([0e0de5f](https://github.com/kythia/kythia/commit/0e0de5fcdaf5ac8574f88edec35ab87a886a7fcc))
* implement character selection and bonuses in adventure commands ([b919771](https://github.com/kythia/kythia/commit/b919771955c01d4996023682e287811490ce45e6))

### [0.9.9-beta-rc.4](https://github.com/kythia/kythia/compare/v0.9.9-beta-rc.3...v0.9.9-beta-rc.4) (2025-10-18)


### 🔧 Changed

* enhance caching and model interactions across various commands ([574636b](https://github.com/kythia/kythia/commit/574636b72dd0c40e4080e84051262b9a9f2232f7))
* improve caching and command structure across various modules ([fb3d7e5](https://github.com/kythia/kythia/commit/fb3d7e5513c2ef3d10d15baf310484b765300d84))
* improve Redis auto-reconnect logic and code consistency ([4f8f182](https://github.com/kythia/kythia/commit/4f8f1827511006fffdb658f94052612cae743520))
* streamline model definitions and enhance touch method ([a2c3465](https://github.com/kythia/kythia/commit/a2c346589d692f495a39aaac0b85dbd4784a69fc))
* streamline order processing and enhance model definitions ([244327c](https://github.com/kythia/kythia/commit/244327c625daf192e11ab86d1e3a049e091c49e6))
* update economy commands to use BigInt for currency calculations ([5545223](https://github.com/kythia/kythia/commit/5545223abe770e51450aec016f57dcdbd9629c0a))
* update version mark to all files to v0.9.9-beta-rc.3 ([6558870](https://github.com/kythia/kythia/commit/655887038ba36f2299b5588ba7c3a1f7048d3241))


### 🔨 Fixed

* add GuildMember partial to improve message handling and refine user filter logic ([59da428](https://github.com/kythia/kythia/commit/59da42847c220a51a39434441d851ddecaf5dcad))
* correct user filter function syntax in KythiaClient (again) ([a779792](https://github.com/kythia/kythia/commit/a779792cefbefaa657b13c625f341e8656f81117))
* enhance prefix matching in message handling to be case-insensitive ([db9c677](https://github.com/kythia/kythia/commit/db9c6774d302c54455240f860e697a5d69c3d501))
* refine user filter logic in KythiaClient to handle potential null values for guild and voice properties ([236fbbc](https://github.com/kythia/kythia/commit/236fbbc7950f7034a6724c5b42702a20e28b6e10))
* still trying to fix cache and database miss data cuz BigInt func ([e872164](https://github.com/kythia/kythia/commit/e8721640ae6e32dd622ef1da0fa341dff4eef99c))
* update embed color in economy commands and refine user filter logic in KythiaClient ([b591a29](https://github.com/kythia/kythia/commit/b591a297af2c15db06ebc3d58d64f35ca1e4f4f8))


### ✨ Added

* add booster log settings and commands ([f534903](https://github.com/kythia/kythia/commit/f53490378094def9947ce1136ab20ca94bf0a935))
* add owner bypass filter for AI response to allow privileged users ([db13983](https://github.com/kythia/kythia/commit/db139830b6d31578a0548c4d8132c90285712acb))
* add ownerSkipCooldown setting and enhance Redis auto-reconnect logic ([e80ef95](https://github.com/kythia/kythia/commit/e80ef95b2920d9da8bf37fde1b4ec1180b3399d4))
* enhance guild creation event with dynamic invite link generation and improved embed details ([a048457](https://github.com/kythia/kythia/commit/a048457b10bff688f2575fb160925549c9fef25d))
* Enhance market command with realistic trading features ([4a25690](https://github.com/kythia/kythia/commit/4a256909b9bca12b79f2dbe0bbe8329d5f766a53))
* global merriage system; ([52cf603](https://github.com/kythia/kythia/commit/52cf60304ef8c7ba33f64fcb61b8bf0ca476d1dc))
* implement AI response filtering to prevent unwanted tags in messages ([8c6de02](https://github.com/kythia/kythia/commit/8c6de0263ab75b8c3fecb591398eb6ab1f5a18df))
* implement server booster log feature toggle in settings; ([78d5d82](https://github.com/kythia/kythia/commit/78d5d82af18f7254806c15b3e145b7b37c9ad11b))

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
