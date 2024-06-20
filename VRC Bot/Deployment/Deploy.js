import { REST, Routes } from 'discord.js';
import Config from "../Config.json" assert { type: 'json' }
import fs from "node:fs";

const Commands = [];
// Grab all the command files from the commands directory you created earlier
const Files = fs.readdirSync('../Commands').filter(file => file.endsWith('.mjs'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const File of Files) {
	const Command = await import(`../Commands/${File}`);
	Commands.push(Command.Data.toJSON());
}

// Construct and prepare an instance of the REST module
const Rest = new REST({ version: '10' }).setToken(Config.Discord.Token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${Commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const Data = await Rest.put(
			Routes.applicationGuildCommands(Config.Discord.AppID, Config.Discord.ServerID),
			{ body: Commands },
		);

		console.log(`Successfully reloaded ${Data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();