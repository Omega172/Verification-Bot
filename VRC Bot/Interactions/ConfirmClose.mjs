import Config from "./../Config.json" assert { type: 'json' }
import { EmbedBuilder } from "discord.js";

export var Name = "ConfirmClose.mjs";

export async function Run(Interaction) {
    function SendErrorMessage(Message) {
        console.log(Message)

        const Channel = interaction.client.channels.cache.get(Config.Discord.ErrorsID);
        if (Channel) {
            Channel.send(Message);
        }
    }

    await Interaction.deferReply({ephemeral: true });

    if (!Interaction.member.roles.cache.some(r => config.discord.staffRoles.includes(r.id))) {
        SendErrorMessage(`This dummy <@${Interaction.member.id}> tried to close a ticket with out the correct perms.`);
        return Interaction.editReply({ content: `You do not have the perms needed to close the ticket`, ephemeral: true });
    }

    if (Interaction.message.embeds[0].fields.length < 3) {
        try {
            return Interaction.channel.delete("Ticket closed");
        } catch (error) {
            return SendErrorMessage(`Failed to delete channel: ${Interaction.channel.id}`);
        }
    }

    const UserID = Interaction.message.embeds[0].fields[0].value;
    const VRCLink = Interaction.message.embeds[0].fields[1].value;
    const VRCID = Interaction.message.embeds[0].fields[2].value;

    let User = null;
    const AllMembers = await Interaction.guild.members.fetch();
    AllMembers.forEach(Member => {
        if (Member.id == UserID) {
            User = Member;
        }
    });

    if (!User) {
        try {
            Interaction.message.delete();
        } catch (Error) {
            SendErrorMessage(`Error: ${Error}`);
            return SendErrorMessage(`Failed to delete message: ${Interaction.message.id}`);
        }
        return Interaction.reply({ content: `Failed to get handle to user`, ephemeral: true });
    } else {
        const IsVerified = User.roles.cache.some(r => config.discord.verifiedRoles.includes(r.id));
        if (!IsVerified) {
            try {
                return Interaction.channel.delete("Ticket closed");
            } catch(Error) {
                SendErrorMessage(`Error: Error`);
                return SendErrorMessage(`Failed to delete message: ${Interaction.message.id}`);
            }
        }
    }

    const IsVerified = User.roles.cache.some(r => r.id == config.discord.verifiedRoles[0]);
    const IsVerifiedPlus = User.roles.cache.some(r => r.id == config.discord.verifiedRoles[1]);

    const Embed = new EmbedBuilder()
        .setColor(0x00ffff)
        .setTitle('Transcript')
        .setDescription(`Verification transcript for <@${UserID}>`)
        .addFields(
            { name: 'Staff Member', value: `<@${Interaction.member.id}>` },
            { name: 'User', value: `Discord: <@${UserID}>\nVRC Link: ${VRCLink}\nVRC ID: ${VRCID}}` },
            { name: 'Verified', value: `${IsVerified.toString()}` },
            { name: 'Verified Plus', value: `${IsVerifiedPlus.toString()}` }
        )
        .setTimestamp()
        .setFooter({ text: 'Bot made by Omega172' });

    const TranscriptChannel = Interaction.guild.channels.cache.get(Config.Discord.TranscriptID);
    TranscriptChannel.send({ embeds: [Embed] });

    try {
        return Interaction.channel.delete("Ticket closed");
    } catch (error) {
        return SendErrorMessage(`Failed to delete message: ${Interaction.message.id}`);
    }
}