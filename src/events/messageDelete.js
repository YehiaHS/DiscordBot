const { Events } = require('discord.js');
const { handleMessageDelete } = require('../features/moderationLogs');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        await handleMessageDelete(message);
    },
};
