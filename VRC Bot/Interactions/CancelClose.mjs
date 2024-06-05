import config from "./../config.json" assert { type: 'json' }

export async function run(interaction) {
    await interaction.deferReply({ephemeral: true });

    const hasPerms = interaction.member.roles.cache.some(r => config.discord.staffRoles.includes(r.id));
    if (!hasPerms) {
        sendErrorMessage(`This dummy <@${interaction.member.id}> tried to close a ticket with out the correct perms.`);
        return interaction.editReply({ content: `You do not have the perms needed to close the ticket.`, ephemeral: true });
    }

    interaction.message.delete();
    return interaction.editReply({ content: `You got it boss the ticket will be left open.`, ephemeral: true });
}