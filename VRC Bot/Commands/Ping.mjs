import { SlashCommandBuilder } from 'discord.js';

export async function run(interaction) {
    await interaction.deferReply({ephemeral: true });
	await interaction.editReply({ content: `Pong: ${interaction.client.ws.ping}ms to Discord WebSocket`, ephemeral: true });
    return;
}

export var data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');