const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;
const chatbot = require('../../chatbot/app');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('s')
        .setDescription('Give a short summary of a given movie or TV series')
        .addStringOption(option =>
            option.setName('movie')
                .setDescription('Name of movie/series to summarize').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const userInput = interaction.options.getString('movie') ?? 'Default movie name';

        /* Run chatbot code here */
        const prompt = "Please provide a synopsis for the following film OR TV series: \"" + userInput + "\". This will either be a film OR a TV series, but not both.";
        const command = "synopsis";
        const chatbotReply = await chatbot.run(prompt, command);

        await wait(3_000);
        await interaction.editReply(chatbotReply);
    },
};