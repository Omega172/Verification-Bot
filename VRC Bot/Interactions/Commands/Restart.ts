//process.exit(1);
import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DiscordType } from '../../Types.js';

export async function Run(Discord: DiscordType, Interaction: ChatInputCommandInteraction<CacheType>) {
    await Interaction.deferReply({ephemeral: false });
    if (Interaction.channelId != Discord.Config.LogChannelID) {
        await Interaction.editReply({ content: `This command must be used in <#${Discord.Config.LogChannelID}>` });
    }

	await Interaction.editReply({ content: `Bot will restart soon` });
    return;
}

export const Data: SlashCommandBuilder = new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Restarts the bot');