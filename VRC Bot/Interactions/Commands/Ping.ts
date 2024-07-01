import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DiscordType } from '../../Types.js';

export async function Run(Discord: DiscordType, Interaction: ChatInputCommandInteraction<CacheType>) {
    await Interaction.deferReply({ephemeral: true });
	await Interaction.editReply({ content: `Pong: ${Discord.Client.ws.ping}ms to Discord Web Socket` });
    return;
}

export const Data: SlashCommandBuilder = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong');