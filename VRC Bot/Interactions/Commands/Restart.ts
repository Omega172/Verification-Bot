import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DiscordType } from '../../Types.js';

function sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

export async function Run(Discord: DiscordType, Interaction: ChatInputCommandInteraction<CacheType>) {
    await Interaction.deferReply({ephemeral: false });
    if (Interaction.channelId != Discord.Config.LogChannelID) {
        await Interaction.editReply({ content: `This command must be used in <#${Discord.Config.LogChannelID}>` });
    }

	await Interaction.editReply({ content: `Bot will restart soon` });
    sleep(3000);
    process.exit(1);
    return;
}

export const Data: SlashCommandBuilder = new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Restarts the bot');