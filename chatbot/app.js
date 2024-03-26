require('dotenv').config();

const { BufferMemory } = require("langchain/memory");
const { DynamoDBChatMessageHistory } = require("@langchain/community/stores/message/dynamodb");
const { ChatOpenAI } = require("@langchain/openai");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { TavilySearchResults } = require("@langchain/community/tools/tavily_search");
const { AgentExecutor, createOpenAIToolsAgent } = require("langchain/agents");
const { RunnableWithMessageHistory } = require("@langchain/core/runnables");
// const { DiscordSendMessagesTool } = require("@langchain/community/tools/discord");

const run = async (userInput, command) => {
    // 1. Connect to DynamoDB
    const memory = new BufferMemory({
        chatHistory: new DynamoDBChatMessageHistory({
            tableName: "langchain",
            partitionKey: "id",
            sessionId: command,     // switch session depending on discord command
            config: {
                region: "us-west-2",
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY,
                    secretAccessKey: process.env.AWS_SECRET_KEY,
                },
            },
        }),
    });

    // 2. Setup agent with model, prompt, & tools
    const chat = new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        temperature: 0,
    });
    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            `
                "You are a helpful chatbot to help users with questions about movies and TV series. 
                Some questions involve providing the synopsis for a film OR the synopsis for a TV series, but not both.

                You may not need to use tools for every query - sometimes the user may just want to chat.
            `
        ],
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
        new MessagesPlaceholder("agent_scratchpad"),
    ]);

    const searchTool = new TavilySearchResults({
        maxResults: 1,
    });
    const tools = [searchTool];

    const agent = await createOpenAIToolsAgent({
        llm: chat,
        prompt,
        tools,
    });
    const agentExecutor = new AgentExecutor({
        agent,
        tools,
    });

    // 3. Setup chat history (limited to last 20 messages)
    const chat_history = await memory.chatHistory.getMessages();
    if (chat_history.length >= 20) {
        await memory.chatHistory.clear();
        for (const message of chat_history.slice(-20)) {
            await memory.chatHistory.addMessage(message);
        }
    }

    // 4. Run agent
    const conversationalAgentExecutor = new RunnableWithMessageHistory({
        runnable: agentExecutor,
        getMessageHistory: (_sessionId) => memory.chatHistory,
        inputMessagesKey: "input",
        outputMessagesKey: "output",
        historyMessagesKey: "chat_history",
    });
    const result = await conversationalAgentExecutor.invoke(
        { input: userInput },
        { configurable: { sessionId: "unused" } }
    );
    
    /* Use LangChain wrapper instead of directly calling discord.js functions */ 
    // const sendMessageTool = new DiscordSendMessagesTool();
    // const sendMessageResults = await sendMessageTool.invoke(result.output);
    // console.log(sendMessageResults);

    return result.output;
};

exports.run = run;