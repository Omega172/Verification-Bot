import { REST, Routes } from 'discord.js';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync("config.json", "utf-8", err => { if (err) Log(chalk.red(`Config read error: ${err}`)); }));

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(config.discord.token);

// and delete your commands!
rest.put(Routes.applicationGuildCommands(config.discord.appID, config.discord.serverID), { body: [] })
	.then(() => console.log('Successfully deleted all guild commands.'))
	.catch(console.error);