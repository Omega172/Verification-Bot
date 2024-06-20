import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export var Name = "Info";

export async function Run(Interaction) {
    const Embed = new EmbedBuilder()
        .setColor(0x00ffff)
        .setTitle('Bot Info')
        .setDescription('Details about the bot')
        .addFields(
            { name: 'Made by:', value: `<@583327588576002048>` },
            { name: `Repo`, value: `https://github.com/Omega172/Verification-Bot`},
        )
        .setTimestamp()
        .setFooter({ text: 'Bot made by Omega172' });

    await Interaction.reply({ embeds: [Embed] });
}

export var Data = new SlashCommandBuilder()
    .setName(Name.toLowerCase())
    .setDescription('Gives some info about the bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);