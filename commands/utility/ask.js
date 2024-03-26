const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Send the chatbot a message or question')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('Message for the chatbot').setRequired(true)),
    async execute(interaction) {
        const userInput = interaction.options.getString('input') ?? 'Default input message here';
        console.log(userInput);
        await interaction.reply('You asked: ' + userInput);
    },
};