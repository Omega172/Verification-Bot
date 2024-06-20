import Config from "./../Config.json" assert { type: 'json' }
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";

export var Name = "VerifyPlus";

export async function Run(Interaction) {
    function SendErrorMessage(Message) {
        console.log(Message);
        const Channel = Interaction.client.channels.cache.get(Config.Discord.ErrorsID);
        if (Channel) {
            Channel.send(Message);
        }
    }
    await Interaction.deferReply({ephemeral: true });
    
    if (!Interaction.member.roles.cache.some(Role => Config.Discord.StaffRoles.includes(Role.id))) {
        SendErrorMessage(`This dumbass <@${Interaction.member.id}> probably tried to verify their self LMFAO!!`);
        return Interaction.editReply({ content: `You do not have the perms needed to verify plus users`, ephemeral: true });
    }

    const Embed = EmbedBuilder.from(await Interaction.message.embeds[0]).setTitle('Are you sure you want to verify plus this user?');

    const VerifyPlusConfirmButton = new ButtonBuilder()
        .setCustomId('VerifyPlusConfirm')
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Danger);

    const Row = new ActionRowBuilder()
        .addComponents(VerifyPlusConfirmButton);

    return Interaction.editReply({ content: 'To cancel just dismiss this message.', embeds: [Embed], components: [Row] });
}