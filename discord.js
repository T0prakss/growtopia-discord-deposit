const Discord = require('discord.js');
const mysql = require('mysql2/promise');
const os = require('os');

const client = new Discord.Client();
const prefix = '/'; // Command prefix

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'discord'
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', async (message) => {
  // Ignore messages from bots and messages without prefix
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  if (command === 'setgrowid') {
    const username = args[0];
  
    // Check if a username was provided
    if (!username) {
      return message.reply('Please provide a username.');
    }
  
    try {
      // Check if user already has a GrowID set
      const [rows, fields] = await db.execute(
        'SELECT * FROM users WHERE discord_id = ?',
        [message.author.id]
      );
  
      if (rows.length > 0) {
        const currentUsername = rows[0].grow_id;
        if (currentUsername === username) {
          return message.reply('Your GrowID is already set to that value.');
        } else {
          return message.reply(`You already have a GrowID set (${currentUsername}).`);
        }
      }
  
      // Save username to database
      await db.execute(
        'INSERT INTO users (discord_id, discord_tag, grow_id, created_at) VALUES (?, ?, ?, NOW())',
        [message.author.id, message.author.tag, username]
      );
  
      message.reply(`Your GrowID has been set to ${username}.`);
    }
     catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        message.reply('That GrowID is already in use.');
      } else {
        console.error(error);
        message.reply('An error occurred while saving your GrowID.');
      }
    }
  }
  if (command === 'ping') {
    const embed = new Discord.MessageEmbed()
      .setTitle('Ping')
      .setColor('#00ff00')
      .addField('Latency', `${Date.now() - message.createdTimestamp}ms`)
      .addField('API Latency', `${Math.round(client.ws.ping)}ms`)
      .addField('RAM Usage', `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`)
      .addField('CPU Usage', `${(process.cpuUsage().user / os.cpus().length / 1000000).toFixed(2)}%`);

    message.channel.send(embed);
  }

  if (command === 'changegrowid') {
    const newUsername = args[0];
  
    // Check if a username was provided
    if (!newUsername) {
      return message.reply('Please provide a new username.');
    }
  
    try {
      // Check if user already has a GrowID set
      const [rows, fields] = await db.execute(
        'SELECT * FROM users WHERE discord_id = ?',
        [message.author.id]
      );
  
      if (rows.length === 0) {
        return message.reply('You do not have a GrowID set.');
      }
  
      const currentUsername = rows[0].grow_id;
      if (currentUsername === newUsername) {
        return message.reply('Your GrowID is already set to that value.');
      }
  
      // Check if new username is available
      const [rows2, fields2] = await db.execute(
        'SELECT * FROM users WHERE grow_id = ?',
        [newUsername]
      );
  
      if (rows2.length > 0) {
        return message.reply('That GrowID is already in use.');
      }
  
      // Update username in database
      await db.execute(
        'UPDATE users SET grow_id = ? WHERE discord_id = ?',
        [newUsername, message.author.id]
      );
  
      message.reply(`Your GrowID has been changed from ${currentUsername} to ${newUsername}.`);
    } catch (error) {
      console.error(error);
      message.reply('An error occurred while changing your GrowID.');
    }
  }
  if (command === 'buyaccount') {
    const amount = parseInt(args[0]);
  
    // Check if a valid amount was provided
    if (!amount || amount < 1) {
      return message.reply('Please provide a valid amount to buy.');
    }
    if (!amount || amount > 250) {
        return message.reply('Out of Stock.');
      }
    
    try {
      // Check if user has enough balance
      const [rows, fields] = await db.execute(
        'SELECT balance FROM users WHERE discord_id = ?',
        [message.author.id]
      );
  
      if (rows.length === 0) {
        return message.reply('You have not set your GrowID yet.');
      }
  
      const balance = rows[0].balance;
      const totalCost = amount * 250;
  
      if (balance < totalCost) {
        return message.reply(`You don't have enough balance. The total cost for ${amount} account(s) is ${totalCost} Wls.`);
      }
  
      // Deduct balance from user's account
      await db.execute(
        'UPDATE users SET balance = balance - ? WHERE discord_id = ?',
        [totalCost, message.author.id]
      );
  
      // Select random accounts from the database
      const [rows2, fields2] = await db.execute(
        'SELECT * FROM account ORDER BY RAND() LIMIT ?',
        [amount]
      );
  
      // Send account information to user
      let accountsText = '';
      for (const row of rows2) {
        accountsText += `Username: ${row.username}\nPassword: ${row.password}\nLevel: ${row.level}\nGems: ${row.gems}\nBalance: ${row.balance}\n\n`;
      }
  
      message.author.send(`Here are your ${amount} account(s):\n\n${accountsText}`);
      message.reply(`Successfully bought ${amount} account(s) for ${totalCost} Wls. Check your DMs for the account information.`);
    } catch (error) {
      console.error(error);
      message.reply('An error occurred while buying accounts.');
    }
  }  
  if (message.content.startsWith('/deposit')) {
    const depositText = '```Put your DLS, WLS in GrowBet77 bot and it will be automatically added to your balance.```';
    message.channel.send(depositText);
    
    // Here you could add code to automatically detect and upload the DLS to the user's balance in the database
    // You could use Discord.js's message collector to listen for a message from the user with the amount of DLS they deposited, and then update their balance accordingly in the database
  }
   else if (command === 'checkbalance') {
    try {
      // Get user data from database
      const [rows, fields] = await db.execute(
        'SELECT balance FROM users WHERE discord_id = ?',
        [message.author.id]
      );

      if (rows.length > 0) {
        const balance = rows[0].balance;
        message.reply(`Your balance is ${balance} Wls.`);
      } else {
        message.reply('You have not set your GrowID yet.');
      }
    } catch (error) {
      console.error(error);
      message.reply('An error occurred while getting your balance.');
    }
  }
});

client.login('ur discord token');
