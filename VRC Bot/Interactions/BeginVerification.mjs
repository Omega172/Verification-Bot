import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";

export var Name = "BeginVerification";

export async function Run(Interaction) {
    const Modal = new ModalBuilder()
    .setCustomId('beginModal')
    .setTitle('Verification');

    const LinkInput = new TextInputBuilder()
        .setCustomId('profileLink')
        .setLabel("Please input your VRChat profile link")
        .setStyle(TextInputStyle.Short);

    Modal.addComponents((new ActionRowBuilder()).addComponents(LinkInput));

    await Interaction.showModal(Modal);
    return;
}