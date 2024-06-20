import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";

export var Name = "CloseTicket";

export async function Run(Interaction) {
    await Interaction.deferReply({ephemeral: false });

    const Embed = EmbedBuilder.from(await Interaction.message.embeds[0]).setTitle('Are you sure you want to close the ticket?');
    
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

    await Interaction.followUp({ embeds: [Embed], components: [Row]});

    return;
}