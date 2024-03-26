const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
const chatbot = require('../../chatbot/app');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('s')
        .setDescription('Give a short summary of a given movie')
        .addStringOption(option =>
            option.setName('movie')
                .setDescription('Name of movie to summarize').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const userInput = interaction.options.getString('movie') ?? 'Default movie name';

        /* Run chatbot code here */
        const chatbotReply = await chatbot.run(userInput);

        await wait(5_000);
        await interaction.editReply("(Edited) Summary of the movie: \"" + chatbotReply + "\"");

    },
};