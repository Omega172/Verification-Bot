import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export async function run(interaction) {
    await interaction.reply(".");
    await interaction.deleteReply()

    const embed = new EmbedBuilder()
        .setColor(0x00ffff)
        .setTitle('Verification')
        .setDescription('Create your verification ticket here')
        .addFields(
            { name: 'What you will need', value: 'Have already joined the VRC group\nA form of ID with a date of birth and your beautiful face\nA piece of paper and a writing implement\nYour vrchat profile link' }
        )
        .setTimestamp()
        .setFooter({ text: 'Bot made by Omega172' });

    const create = new ButtonBuilder()
        .setCustomId('CreateVerificationTicket')
        .setLabel('Create Ticket')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
        .addComponents(create);

    await interaction.channel.send({ embeds: [embed], components: [row] });
}

export var data = new SlashCommandBuilder()
    .setName('create')
    .setDescription('Creates the verification embed')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);