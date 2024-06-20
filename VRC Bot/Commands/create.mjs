import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export var Name = "Create";

export async function Run(Interaction) {
    await Interaction.reply(".");
    await Interaction.deleteReply()

    const Embed = new EmbedBuilder()
        .setColor(0x00ffff)
        .setTitle('Verification')
        .setDescription('Create your verification ticket here')
        .addFields(
            { name: 'What you will need', value: 'Have already joined the VRC group\nA form of ID with a date of birth and your beautiful face\nA piece of paper and a writing implement\nYour vrchat profile link' }
        )
        .setTimestamp()
        .setFooter({ text: 'Bot made by Omega172' });

    const Create = new ButtonBuilder()
        .setCustomId('CreateVerificationTicket')
        .setLabel('Create Ticket')
        .setStyle(ButtonStyle.Secondary);

    const Row = new ActionRowBuilder()
        .addComponents(Create);

    await Interaction.channel.send({ embeds: [Embed], components: [Row] });
}

export var Data = new SlashCommandBuilder()
    .setName(Name.toLowerCase())
    .setDescription('Creates the verification embed')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);