import config from "./../config.json" assert { type: 'json' }
import { EmbedBuilder } from "discord.js";

export async function run(interaction) {
    function sendErrorMessage(msg) {
        const channel = interaction.client.channels.cache.get(config.discord.errorsID);
        if (channel) {
            channel.send(msg);
        }
    }

    await interaction.deferReply({ephemeral: true });

    if (!interaction.member.roles.cache.some(r => config.discord.staffRoles.includes(r.id))) {
        sendErrorMessage(`This dummy <@${interaction.member.id}> tried to close a ticket with out the correct perms.`);
        return interaction.editReply({ content: `You do not have the perms needed to close the ticket`, ephemeral: true });
    }

    if (interaction.message.embeds[0].fields.length < 3) {
        try {
            return interaction.channel.delete("Ticket closed");
        } catch (error) {
            console.log(`Failed to delete channel: ${interaction.channel.id}`);
            return sendErrorMessage(`Failed to delete channel: ${interaction.channel.id}`);
        }
    }

    const userID = interaction.message.embeds[0].fields[0].value;
    const vrcLink = interaction.message.embeds[0].fields[1].value;
    const vrcID = interaction.message.embeds[0].fields[2].value;

    let user = null;
    const allMembers = await interaction.guild.members.fetch();
    allMembers.forEach(m => {
        if (m.id == userID) {
            user = m;
        }
    });

    if (!user) {
        try {
            interaction.message.delete();
        } catch (error) {
            console.log(`Failed to delete message: ${interaction.message.id}`);
            return sendErrorMessage(`Failed to delete message: ${interaction.message.id}`);
        }
        return interaction.reply({ content: `Failed to get handle to user`, ephemeral: true });
    } else {
        const isVerified = user.roles.cache.some(r => config.discord.verifiedRoles.includes(r.id));
        if (!isVerified) {
            try {
                return interaction.channel.delete("Ticket closed");
            } catch(error) {
                console.log(`Failed to delete message: ${interaction.message.id}`);
                return sendErrorMessage(`Failed to delete message: ${interaction.message.id}`);
            }
        }
    }

    const isVerified = user.roles.cache.some(r => r.id == config.discord.verifiedRoles[0]);
    const isVerifiedPlus = user.roles.cache.some(r => r.id == config.discord.verifiedRoles[1]);

    const embed = new EmbedBuilder()
        .setColor(0x00ffff)
        .setTitle('Transcript')
        .setDescription(`Verification transcript for <@${userID}>`)
        .addFields(
            { name: 'Staff Member', value: `<@${interaction.member.id}>` },
            { name: 'User', value: `Discord: <@${userID}>\nVRC Link: ${vrcLink}\nVRC ID: ${vrcID}}` },
            { name: 'Verified', value: `${isVerified.toString()}` },
            { name: 'Verified Plus', value: `${isVerifiedPlus.toString()}` }
        )
        .setTimestamp()
        .setFooter({ text: 'Bot made by Omega172' });

    const transcriptChannel = interaction.guild.channels.cache.get(config.discord.transcriptID);
    transcriptChannel.send({ embeds: [embed] });

    try {
        return interaction.channel.delete("Ticket closed");
    } catch (error) {
        console.log(`Failed to delete message: ${interaction.message.id}`);
        return sendErrorMessage(`Failed to delete message: ${interaction.message.id}`);
    }
}