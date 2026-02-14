require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const USER_ID = '342319965988454401';

client.once('ready', async () => {
    console.log(`Bot logged in as ${client.user.tag}`);
    const guildId = process.env.GUILD_ID;

    if (!guildId) {
        console.error('GUILD_ID is not defined in .env');
        process.exit(1);
    }

    try {
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(USER_ID);

        console.log(`Fetched member: ${member.user.tag}`);

        const botMember = await guild.members.fetch(client.user.id);
        const botHighestRole = botMember.roles.highest;
        console.log(`Bot highest role: ${botHighestRole.name} (Position: ${botHighestRole.position})`);

        const rolesToAdd = ['White ppl with power'];
        let roleObjects = [];

        for (const roleName of rolesToAdd) {
            let role = guild.roles.cache.find(r => r.name === roleName);
            if (!role) {
                console.log(`Role "${roleName}" not found. Creating it...`);
                role = await guild.roles.create({
                    name: roleName,
                    reason: 'Promotion request by user'
                });
            }
            console.log(`Role "${role.name}" position: ${role.position}`);
            roleObjects.push(role);
        }

        if (roleObjects.some(r => r.position >= botHighestRole.position)) {
            console.error('CRITICAL: One or more target roles are above or equal to the bot\'s highest role. Bot cannot manage these roles.');
        }

        await member.roles.add(roleObjects);
        console.log('DONE_PROMOTION');
        console.log(`Successfully added roles ${rolesToAdd.join(', ')} to ${member.user.tag}`);

    } catch (error) {
        console.error('Error in promotion script:', error);
    } finally {
        client.destroy();
        process.exit(0);
    }
});

client.login(process.env.DISCORD_TOKEN);
