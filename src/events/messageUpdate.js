const { Events } = require('discord.js');
const { handleMessageUpdate } = require('../features/moderationLogs');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        await handleMessageUpdate(oldMessage, newMessage);
    },
};
