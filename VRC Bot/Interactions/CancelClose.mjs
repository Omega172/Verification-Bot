import Config from "./../Config.json" assert { type: 'json' }

export var Name = "CancelClose";

export async function Run(Interaction) {
    await Interaction.deferReply({ephemeral: true });

    const HasPerms = Interaction.member.roles.cache.some(Role => Config.Discord.StaffRoles.includes(Role.id));
    if (!HasPerms) {
        sendErrorMessage(`This dummy <@${Interaction.member.id}> tried to close a ticket with out the correct perms.`);
        return Interaction.editReply({ content: `You do not have the perms needed to close the ticket.`, ephemeral: true });
    }

    Interaction.message.delete();
    return Interaction.editReply({ content: `You got it boss the ticket will be left open.`, ephemeral: true });
}