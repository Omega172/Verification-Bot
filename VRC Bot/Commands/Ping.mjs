import { SlashCommandBuilder } from 'discord.js';

export var Name = "Ping";

export async function Run(Interaction) {
    await Interaction.deferReply({ephemeral: true });
	await Interaction.editReply({ content: `Pong: ${Interaction.client.ws.ping}ms to Discord Web Socket`, ephemeral: true });
    return;
}

export var Data = new SlashCommandBuilder()
    .setName(Name.toLowerCase())
    .setDescription('Replies with Pong!');