import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandOptionsOnlyBuilder, PermissionFlagsBits } from 'discord.js';
import { DiscordType } from '../../Types.js';

export async function Run(Discord: DiscordType, Interaction: ChatInputCommandInteraction<CacheType>) {
    const Channel = Interaction.options.getChannel<ChannelType.GuildText>('target_channel');
    if (!Channel) return;

    const Embed: EmbedBuilder = new EmbedBuilder()
        .setColor(0x00FFFF)
        .setTitle('Verification')
        .setFooter({ text: 'Made by Omega172', iconURL: Interaction.user.displayAvatarURL() })
        .setDescription('Press the \`Create Ticket\` to create your ticket.')
        .setTimestamp(Date.now())

    const CreateButton: ButtonBuilder = new ButtonBuilder()
        .setCustomId('TicketCreate')
        .setLabel('Create Ticket')
        .setEmoji('📎')
        .setStyle(ButtonStyle.Success);

    const Row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(CreateButton);

    Channel.send({ embeds: [Embed], components: [Row] });
    return Interaction.reply({ content: `Embed sent to <#${Channel.id}>`, ephemeral: true });
}

export const Data: SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName('create')
    .setDescription('Creates a test embed with buttons')
    .addChannelOption(Option => {
        Option.setName('target_channel');
        Option.setDescription('The channel to which the embed should be sent');
        Option.addChannelTypes(ChannelType.GuildText);
        Option.setRequired(true);
        return Option;
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);;