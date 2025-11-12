## 📁 Command Category: Utils

### 💾 `/about`

**Description:** 😋 A brief introduction about kythia

### 📋 Details

- **Aliases:** `abt`, `🌸`
### 💻 Usage

`/about`



### 💾 `/afk`

**Description:** 💤 Set your Away From Keyboard (AFK) status.

### 💻 Usage

`/afk [reason]`

### ⚙️ Options

- **`reason`**
  - **Description:** The reason for being AFK.
  - **Type:** Text


### 💾 `/cache`

**Description:** Shows cache statistics.

### 💻 Usage

`/cache`



### 💾 `/convert`

**Description:** 🔄 Convert between units, currencies, timezones, etc.

### 💻 Usage

`/convert currency <from> <to> <amount>`
`/convert timezone <from> <to> <time>`
`/convert length <from> <to> <value>`
`/convert mass <from> <to> <value>`
`/convert temperature <from> <to> <value>`
`/convert data <from> <to> <value>`
`/convert area <from> <to> <value>`
`/convert volume <from> <to> <value>`

### 🔧 Subcommands

**`/convert currency <from> <to> <amount>`**
> 💰 Convert currency (e.g. USD to IDR)

**Options for this subcommand:**
- **`from*`**
  - **Description:** Currency code (e.g. USD)
  - **Type:** Text
  - **Choices:** `IDR` (`IDR`), `USD` (`USD`), `EUR` (`EUR`), `JPY` (`JPY`), `GBP` (`GBP`), `SGD` (`SGD`), `AUD` (`AUD`)
- **`to*`**
  - **Description:** Currency code to convert to (e.g. IDR)
  - **Type:** Text
  - **Choices:** `IDR` (`IDR`), `USD` (`USD`), `EUR` (`EUR`), `JPY` (`JPY`), `GBP` (`GBP`), `SGD` (`SGD`), `AUD` (`AUD`)
- **`amount*`**
  - **Description:** Amount to convert
  - **Type:** Number
**`/convert timezone <from> <to> <time>`**
> ⏰ Convert time between timezones

**Options for this subcommand:**
- **`from*`**
  - **Description:** From timezone
  - **Type:** Text
  - **Choices:** `WIB (Asia/Jakarta)` (`Asia/Jakarta`), `WITA (Asia/Makassar)` (`Asia/Makassar`), `WIT (Asia/Jayapura)` (`Asia/Jayapura`), `UTC` (`UTC`), `EST (America/New_York)` (`America/New_York`), `PST (America/Los_Angeles)` (`America/Los_Angeles`), `CET (Europe/Berlin)` (`Europe/Berlin`), `JST (Asia/Tokyo)` (`Asia/Tokyo`)
- **`to*`**
  - **Description:** To timezone
  - **Type:** Text
  - **Choices:** `WIB (Asia/Jakarta)` (`Asia/Jakarta`), `WITA (Asia/Makassar)` (`Asia/Makassar`), `WIT (Asia/Jayapura)` (`Asia/Jayapura`), `UTC` (`UTC`), `EST (America/New_York)` (`America/New_York`), `PST (America/Los_Angeles)` (`America/Los_Angeles`), `CET (Europe/Berlin)` (`Europe/Berlin`), `JST (Asia/Tokyo)` (`Asia/Tokyo`)
- **`time*`**
  - **Description:** Time (e.g. 10:00 or 2024-06-01 10:00)
  - **Type:** Text
**`/convert length <from> <to> <value>`**
> 📏 Convert length units (e.g. m to km)

**Options for this subcommand:**
- **`from*`**
  - **Description:** From unit
  - **Type:** Text
  - **Choices:** `Meter (m)` (`m`), `Kilometer (km)` (`km`), `Centimeter (cm)` (`cm`), `Millimeter (mm)` (`mm`), `Mile (mi)` (`mi`), `Yard (yd)` (`yd`), `Foot (ft)` (`ft`), `Inch (in)` (`in`), `Nautical Mile (nm)` (`nm`), `Astronomical Unit (au)` (`au`), `Light Year (ly)` (`ly`)
- **`to*`**
  - **Description:** To unit
  - **Type:** Text
  - **Choices:** `Meter (m)` (`m`), `Kilometer (km)` (`km`), `Centimeter (cm)` (`cm`), `Millimeter (mm)` (`mm`), `Mile (mi)` (`mi`), `Yard (yd)` (`yd`), `Foot (ft)` (`ft`), `Inch (in)` (`in`), `Nautical Mile (nm)` (`nm`), `Astronomical Unit (au)` (`au`), `Light Year (ly)` (`ly`)
- **`value*`**
  - **Description:** Value to convert
  - **Type:** Number
**`/convert mass <from> <to> <value>`**
> ⚖️ Convert mass units (e.g. kg to lb)

**Options for this subcommand:**
- **`from*`**
  - **Description:** From unit
  - **Type:** Text
  - **Choices:** `Kilogram (kg)` (`kg`), `Gram (g)` (`g`), `Milligram (mg)` (`mg`), `Ton (ton)` (`ton`), `Pound (lb)` (`lb`), `Ounce (oz)` (`oz`), `Stone (st)` (`st`), `Carat (ct)` (`ct`), `Slug (slug)` (`slug`)
- **`to*`**
  - **Description:** To unit
  - **Type:** Text
  - **Choices:** `Kilogram (kg)` (`kg`), `Gram (g)` (`g`), `Milligram (mg)` (`mg`), `Ton (ton)` (`ton`), `Pound (lb)` (`lb`), `Ounce (oz)` (`oz`), `Stone (st)` (`st`), `Carat (ct)` (`ct`), `Slug (slug)` (`slug`)
- **`value*`**
  - **Description:** Value to convert
  - **Type:** Number
**`/convert temperature <from> <to> <value>`**
> 🌡️ Convert temperature (C, F, K, R, Re)

**Options for this subcommand:**
- **`from*`**
  - **Description:** From unit
  - **Type:** Text
  - **Choices:** `Celsius (C)` (`c`), `Fahrenheit (F)` (`f`), `Kelvin (K)` (`k`), `Rankine (R)` (`r`), `Réaumur (Re)` (`re`)
- **`to*`**
  - **Description:** To unit
  - **Type:** Text
  - **Choices:** `Celsius (C)` (`c`), `Fahrenheit (F)` (`f`), `Kelvin (K)` (`k`), `Rankine (R)` (`r`), `Réaumur (Re)` (`re`)
- **`value*`**
  - **Description:** Value to convert
  - **Type:** Number
**`/convert data <from> <to> <value>`**
> 💾 Convert data storage units (e.g. MB to GB)

**Options for this subcommand:**
- **`from*`**
  - **Description:** From unit
  - **Type:** Text
  - **Choices:** `Byte (B)` (`b`), `Kilobyte (KB)` (`kb`), `Megabyte (MB)` (`mb`), `Gigabyte (GB)` (`gb`), `Terabyte (TB)` (`tb`), `Petabyte (PB)` (`pb`), `Exabyte (EB)` (`eb`), `Zettabyte (ZB)` (`zb`), `Yottabyte (YB)` (`yb`), `Bit (bit)` (`bit`)
- **`to*`**
  - **Description:** To unit
  - **Type:** Text
  - **Choices:** `Byte (B)` (`b`), `Kilobyte (KB)` (`kb`), `Megabyte (MB)` (`mb`), `Gigabyte (GB)` (`gb`), `Terabyte (TB)` (`tb`), `Petabyte (PB)` (`pb`), `Exabyte (EB)` (`eb`), `Zettabyte (ZB)` (`zb`), `Yottabyte (YB)` (`yb`), `Bit (bit)` (`bit`)
- **`value*`**
  - **Description:** Value to convert
  - **Type:** Number
**`/convert area <from> <to> <value>`**
> 🟦 Convert area units (e.g. m² to acre)

**Options for this subcommand:**
- **`from*`**
  - **Description:** From unit
  - **Type:** Text
  - **Choices:** `Square Meter (m²)` (`sqm`), `Square Kilometer (km²)` (`sqkm`), `Square Mile (mi²)` (`sqmi`), `Square Yard (yd²)` (`sqyd`), `Square Foot (ft²)` (`sqft`), `Square Inch (in²)` (`sqin`), `Hectare (ha)` (`ha`), `Acre (acre)` (`acre`)
- **`to*`**
  - **Description:** To unit
  - **Type:** Text
  - **Choices:** `Square Meter (m²)` (`sqm`), `Square Kilometer (km²)` (`sqkm`), `Square Mile (mi²)` (`sqmi`), `Square Yard (yd²)` (`sqyd`), `Square Foot (ft²)` (`sqft`), `Square Inch (in²)` (`sqin`), `Hectare (ha)` (`ha`), `Acre (acre)` (`acre`)
- **`value*`**
  - **Description:** Value to convert
  - **Type:** Number
**`/convert volume <from> <to> <value>`**
> 🧪 Convert volume units (e.g. L to gal)

**Options for this subcommand:**
- **`from*`**
  - **Description:** From unit
  - **Type:** Text
  - **Choices:** `Liter (L)` (`l`), `Milliliter (mL)` (`ml`), `Cubic Meter (m³)` (`m3`), `Cubic Centimeter (cm³)` (`cm3`), `Gallon (gal)` (`gal`), `Quart (qt)` (`qt`), `Pint (pt)` (`pt`), `Cup (cup)` (`cup`), `Fluid Ounce (fl oz)` (`floz`), `Tablespoon (tbsp)` (`tbsp`), `Teaspoon (tsp)` (`tsp`)
- **`to*`**
  - **Description:** To unit
  - **Type:** Text
  - **Choices:** `Liter (L)` (`l`), `Milliliter (mL)` (`ml`), `Cubic Meter (m³)` (`m3`), `Cubic Centimeter (cm³)` (`cm3`), `Gallon (gal)` (`gal`), `Quart (qt)` (`qt`), `Pint (pt)` (`pt`), `Cup (cup)` (`cup`), `Fluid Ounce (fl oz)` (`floz`), `Tablespoon (tbsp)` (`tbsp`), `Teaspoon (tsp)` (`tsp`)
- **`value*`**
  - **Description:** Value to convert
  - **Type:** Number


### 💾 `/grab`

**Description:** 🛍️ grab stickers or emojis from messages.

### 💻 Usage

`/grab sticker <sticker_id>`
`/grab emoji <emoji>`

### 🔧 Subcommands

**`/grab sticker <sticker_id>`**
> grab a sticker from a message

**Options for this subcommand:**
- **`sticker_id*`**
  - **Description:** Sticker ID to grab
  - **Type:** Text
**`/grab emoji <emoji>`**
> grab a custom emoji from a message

**Options for this subcommand:**
- **`emoji*`**
  - **Description:** Emoji to grab (custom emoji format)
  - **Type:** Text


### 💾 `/help`

**Description:** 💡 Displays a list of bot commands with complete details.

### 📋 Details

- **Aliases:** `h`, `ℹ️`
### 💻 Usage

`/help`



### 💾 `/ping`

**Description:** 🔍 Checks the bot's, Discord API's, database and cache/redis connection speed.

### 📋 Details

- **Aliases:** `p`, `pong`, `🏓`
### 💻 Usage

`/ping`



### 💾 `/report`

**Description:** 🚨 Report a user to the moderators.

### 💻 Usage

`/report <user> <reason>`

### ⚙️ Options

- **`user*`**
  - **Description:** User to report
  - **Type:** User
- **`reason*`**
  - **Description:** Reason for the report
  - **Type:** Text


### 💾 `/serverinfo`

**Description:** 📰 Displays detailed information about the server.

### 💻 Usage

`/serverinfo`



### 💾 `/stats`

**Description:** 📊 Displays kythia statistics.

### 📋 Details

- **Aliases:** `s`, `📊`
### 💻 Usage

`/stats`



### 💾 `/userinfo`

**Description:** 📄 Displays information about a user.

### 💻 Usage

`/userinfo [user]`

### ⚙️ Options

- **`user`**
  - **Description:** User to get info about
  - **Type:** User


### 💾 `/vote`

**Description:** ❤️ Vote for kythia on top.gg!

### 📋 Details

- **Aliases:** `v`
### 💻 Usage

`/vote`



