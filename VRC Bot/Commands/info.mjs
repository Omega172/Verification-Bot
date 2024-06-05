import config from "./../config.json" assert { type: 'json' }
import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export async function run(interaction) {
    const Embed = new EmbedBuilder()
        .setColor(0x00ffff)
        .setTitle('Bot Info')
        .setDescription('Details about the bot')
        .addFields(
            { name: 'Made by:', value: `<@583327588576002048>` },
            { name: `Repo`, value: ``},
        )
        .setTimestamp()
        .setFooter({ text: 'Bot made by Omega172' });

    const create = new ButtonBuilder()
        .setCustomId('CreateVerificationTicket')
        .setLabel('Create Ticket')
        .setStyle(ButtonStyle.Secondary);

    const Row = new ActionRowBuilder()
        .addComponents(create);

    await interaction.channel.send({ embeds: [Embed], components: [Row] });
}

export var data = new SlashCommandBuilder()
    .setName('info')
    .setDescription('Gives some info about the bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);