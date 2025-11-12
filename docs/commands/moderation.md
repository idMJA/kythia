## 📁 Command Category: Moderation

### 💾 `/mod`

**Description:** Moderation action

### 💻 Usage

`/mod announce <channel> <message>`
`/mod autosetup`
`/mod ban <user> [reason]`
`/mod clear <amount>`
`/mod kick <user> [reason]`
`/mod lock [channel]`
`/mod mute <user>`
`/mod role <user> <role> <action>`
`/mod say <message>`
`/mod slowmode <duration>`
`/mod timeout <user> <duration>`
`/mod unban <userid>`
`/mod unlock [channel]`
`/mod unmute <user>`
`/mod unpin <message_id>`
`/mod warn <user> <reason>`
`/mod warnings [user]`

### 🔧 Subcommands

**`/mod announce <channel> <message>`**
> 📢 Send an announcement to a specified channel.

**Options for this subcommand:**
- **`channel*`**
  - **Description:** Channel to send the announcement
  - **Type:** Channel
- **`message*`**
  - **Description:** Announcement message
  - **Type:** Text
**`/mod autosetup`**
> Installs/re-installs a set of 6 core AutoMod rules.


**`/mod ban <user> [<reason>]`**
> ⚠️ Ban a user from the server.

**Options for this subcommand:**
- **`user*`**
  - **Description:** User to ban
  - **Type:** User
- **`reason`**
  - **Description:** Reason for ban (optional)
  - **Type:** Text
**`/mod clear <amount>`**
> 🗑️ Delete messages from a channel.

**Options for this subcommand:**
- **`amount*`**
  - **Description:** Amount of messages to delete (0 = all)
  - **Type:** Integer
**`/mod kick <user> [<reason>]`**
> ⚠️ Kick a user from the server.

**Options for this subcommand:**
- **`user*`**
  - **Description:** User to kick
  - **Type:** User
- **`reason`**
  - **Description:** Reason for kick (optional)
  - **Type:** Text
**`/mod lock [<channel>]`**
> 🔒 Locks a channel to prevent messages.

**Options for this subcommand:**
- **`channel`**
  - **Description:** Channel to lock
  - **Type:** Channel
**`/mod mute <user>`**
> 🔇 Mute a user in a voice channel.

**Options for this subcommand:**
- **`user*`**
  - **Description:** User to mute
  - **Type:** User
**`/mod role <user> <role> <action>`**
> ⭕ Add or remove a role from a user.

**Options for this subcommand:**
- **`user*`**
  - **Description:** The user to modify
  - **Type:** User
- **`role*`**
  - **Description:** The role to add or remove
  - **Type:** Role
- **`action*`**
  - **Description:** Choose whether to add or remove the role.
  - **Type:** Text
  - **Choices:** `Add` (`add`), `Remove` (`remove`)
**`/mod say <message>`**
> 💬 Make the bot send a message

**Options for this subcommand:**
- **`message*`**
  - **Description:** Message to send
  - **Type:** Text
**`/mod slowmode <duration>`**
> ⏳ Sets the slowmode for the channel.

**Options for this subcommand:**
- **`duration*`**
  - **Description:** Duration in seconds
  - **Type:** Integer
**`/mod timeout <user> <duration>`**
> ⏰ Puts a user in timeout for a specified duration.

**Options for this subcommand:**
- **`user*`**
  - **Description:** User to timeout
  - **Type:** User
- **`duration*`**
  - **Description:** Duration in seconds
  - **Type:** Integer
**`/mod unban <userid>`**
> 🔓 Unbans a user from the server.

**Options for this subcommand:**
- **`userid*`**
  - **Description:** User ID to unban
  - **Type:** Text
**`/mod unlock [<channel>]`**
> 🔓 Unlocks a channel to allow messages.

**Options for this subcommand:**
- **`channel`**
  - **Description:** Channel to unlock
  - **Type:** Channel
**`/mod unmute <user>`**
> 🔊 Unmutes a user in a voice channel.

**Options for this subcommand:**
- **`user*`**
  - **Description:** User to unmute
  - **Type:** User
**`/mod unpin <message_id>`**
> 📌 Unpins a message in the channel.

**Options for this subcommand:**
- **`message_id*`**
  - **Description:** ID of the message to unpin
  - **Type:** Text
**`/mod warn <user> <reason>`**
> ⚠️ Warn a user.

**Options for this subcommand:**
- **`user*`**
  - **Description:** User to warn
  - **Type:** User
- **`reason*`**
  - **Description:** Reason for the warning
  - **Type:** Text
**`/mod warnings [<user>]`**
> 🔖 Show user warnings.

**Options for this subcommand:**
- **`user`**
  - **Description:** User to check
  - **Type:** User


