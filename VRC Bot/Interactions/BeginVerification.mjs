import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";

export async function run(interaction) {
    const modal = new ModalBuilder()
    .setCustomId('beginModal')
    .setTitle('Verification');

    const linkInput = new TextInputBuilder()
        .setCustomId('profileLink')
        .setLabel("Please input your VRChat profile link")
        .setStyle(TextInputStyle.Short);

    const row = new ActionRowBuilder().addComponents(linkInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
    return;
}