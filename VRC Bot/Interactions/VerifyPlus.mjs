import config from "./../config.json" assert { type: 'json' }
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";

export async function run(interaction) {
    function sendErrorMessage(msg) {
        const channel = client.channels.cache.get(config.discord.errorsID);
        if (channel) {
            channel.send(msg);
        }
    }
    await interaction.deferReply({ephemeral: true });
    
    if (!interaction.member.roles.cache.some(r => config.discord.staffRoles.includes(r.id))) {
        sendErrorMessage(`This dumbass <@${interaction.member.id}> probably tried to verify their self LMFAO!!`);
        return interaction.editReply({ content: `You do not have the perms needed to verify plus users`, ephemeral: true });
    }

    const Embed = EmbedBuilder.from(await interaction.message.embeds[0]).setTitle('Are you sure you want to verify plus this user?');

    const VerifyPlusConfirmButton = new ButtonBuilder()
        .setCustomId('VerifyPlusConfirm')
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Danger);

    const Row = new ActionRowBuilder()
        .addComponents(VerifyPlusConfirmButton);

    return interaction.editReply({ content: 'To cancel just dismiss this message.', embeds: [Embed], components: [Row] });
}