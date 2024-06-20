import Config from "./../Config.json" assert { type: 'json' }
import { ChannelType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'

export var Name = "CreateVerificationTicket";

export async function Run(Interaction) {
    await Interaction.deferReply({ephemeral: true });

    if (Interaction.member.roles.cache.some(Role => Role.id == Config.Discord.VerifiedRoles[1])) {
        return Interaction.editReply({ content: `You are already fully verified dummy :p`, ephemeral: true });
    }

    const ExistingTicket = Interaction.guild.channels.cache.find(channel => channel.name == Interaction.user.displayName.toLowerCase());
    if (ExistingTicket) {
        return Interaction.editReply({ content: `You already have a ticket open: <#${ExistingTicket.id}>`, ephemeral: true });;
    }

    let Channel = await Interaction.guild.channels.create({
        name: Interaction.user.displayName,
        type: ChannelType.GuildText,
        parent: Config.Discord.CategoryID
    });
    Channel.permissionOverwrites.create(Interaction.user.id, { ViewChannel: true });

    const TicketEmbed = new EmbedBuilder()
        .setColor(0x00ffff)
        .setTitle('Ticket Controls')
        .addFields({ name: 'Discord UserID', value: Interaction.user.id })
        .setTimestamp()
        .setFooter({ text: 'Bot made by Omega172' });

    const BeginButton = new ButtonBuilder()
        .setCustomId('BeginVerification')
        .setLabel('Begin Verification')
        .setStyle(ButtonStyle.Primary);

    const VerifyButton = new ButtonBuilder()
        .setCustomId('Verify')
        .setLabel('Verify User')
        .setStyle(ButtonStyle.Secondary)

    const VerifyPlusButton = new ButtonBuilder()
        .setCustomId('VerifyPlus')
        .setLabel('Verify Plus User')
        .setStyle(ButtonStyle.Secondary);

    const CloseTicketButton = new ButtonBuilder()
        .setCustomId('CloseTicket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger);

    const Row = new ActionRowBuilder()
    if (!Interaction.member.roles.cache.some(Role => Role.id == Config.Discord.VerifiedRoles[0])) {
        Row.addComponents(BeginButton, VerifyButton, VerifyPlusButton, CloseTicketButton);
    } else {
        Row.addComponents(BeginButton, VerifyPlusButton, CloseTicketButton);
    }
    Channel.send({ embeds: [TicketEmbed], components: [Row] });

    Channel.send(`Hello, <@${Interaction.user.id}> please press the \`Begin Verification\` button to start.`);
    return Interaction.editReply({ content: `Ticket created: <#${Channel.id}>`, ephemeral: true });
}