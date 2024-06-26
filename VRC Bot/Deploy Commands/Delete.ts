import { REST, Routes } from 'discord.js';
import Config from "../Config.json" assert { type: 'json' }

// Construct and prepare an instance of the REST module
const Rest = new REST({ version: '10' }).setToken(Config.Token);

// and delete your commands!
Rest.put(Routes.applicationGuildCommands(Config.AppID, Config.ServerID), { body: [] })
	.then(() => console.log('Successfully deleted all guild commands.'))
	.catch(console.error);