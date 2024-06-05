import config from "./../config.json" assert { type: 'json' }
import { ChannelType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'

export async function run(interaction) {
    await interaction.deferReply({ephemeral: true });

    if (interaction.member.roles.cache.some(r => r.id == config.discord.verifiedRoles[1])) {
        return interaction.editReply({ content: `You are already fully verified dummy :p`, ephemeral: true });
    }

    const ExistingTicket = interaction.guild.channels.cache.find(channel => channel.name == interaction.user.displayName.toLowerCase());
    if (ExistingTicket) {
        return interaction.editReply({ content: `You already have a ticket open: <#${ExistingTicket.id}>`, ephemeral: true });;
    }

    let Channel = await interaction.guild.channels.create({
        name: interaction.user.displayName,
        type: ChannelType.GuildText,
        parent: config.discord.categoryID
    });
    Channel.permissionOverwrites.create(interaction.user.id, { ViewChannel: true });

    const TicketEmbed = new EmbedBuilder()
        .setColor(0x00ffff)
        .setTitle('Ticket Controls')
        .addFields({ name: 'Discord UserID', value: interaction.user.id })
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
    if (!interaction.member.roles.cache.some(r => r.id == config.discord.verifiedRoles[0])) {
        Row.addComponents(BeginButton, VerifyButton, VerifyPlusButton, CloseTicketButton);
    } else {
        Row.addComponents(BeginButton, VerifyPlusButton, CloseTicketButton);
    }
    Channel.send({ embeds: [TicketEmbed], components: [Row] });

    Channel.send(`Hello, <@${interaction.user.id}> please press the \`Begin Verification\` button to start.`);
    return interaction.editReply({ content: `Ticket created: <#${Channel.id}>`, ephemeral: true });
}