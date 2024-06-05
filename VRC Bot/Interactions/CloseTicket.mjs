import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";

export async function run(interaction) {
    await interaction.deferReply({ephemeral: false });

    const Embed = EmbedBuilder.from(await interaction.message.embeds[0]).setTitle('Are you sure you want to close the ticket?');
    
    const CancelButton = new ButtonBuilder()
        .setCustomId('CancelClose')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Success);

    const ConfirmButton = new ButtonBuilder()
        .setCustomId('ConfirmClose')
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Danger);

    const Row = new ActionRowBuilder()
        .addComponents(CancelButton, ConfirmButton);

    await interaction.followUp({ embeds: [Embed], components: [Row]});

    return;
}