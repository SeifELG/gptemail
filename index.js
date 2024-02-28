
require("dotenv").config();
const path = require("path");
const express = require("express");
const OpenAI = require('openai');
const marked = require('marked')

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')))

app.get("/health", (req, res) => {
    res.send("healthy");
});

app.post("/echo", (req, res) => {
    const data = req.body;
    res.status(200).json({ data: data });
});

app.post("/prompt", async (req, res) => {
    try {
        const data = req.body.prompt;
        const chatCompletion = await simplePrompt({ input: data });
        res.status(200).json(chatCompletion);
    } catch (error) {
        console.error("Error", error);
        res.status(500).send("An error occurred while processing your request.");
    }
});

app.post("/prompt-markdown", async (req, res) => {
    try {
        const data = req.body.prompt;
        const chatCompletion = await simplePrompt({ input: data });

        const markdown = marked.parse(chatCompletion.choices[0].message.content)

        res.status(200).json(markdown);
    } catch (error) {
        console.error("Error", error);
        res.status(500).send("An error occurred while processing your request.");
    }
});

async function simplePrompt({ input }) {
    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: input }],
        model: 'gpt-4-turbo-preview',
        // model: 'gpt-3.5-turbo',
    });
    return chatCompletion;
}

app.post("/to-questions", async (req, res) => {
    try {
        const data = req.body.prompt;
        const chatCompletion = await convertToQA({ input: data });


        res.status(200).json(chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error("Error", error);
        res.status(500).send("An error occurred while processing your request.");
    }
});

async function convertToQA({ input }) {
    const systemPrompt = "You recieve as an input an exerpt from a textbook. You return valid JSON only. You create question and answers based on the material provided. You return an array of question and answer pairs"
    const chatCompletion = await openai.chat.completions.create({
        messages: [ {"role": "system", "content": systemPrompt}, { role: 'user', content: input }],
        model: 'gpt-4-turbo-preview',
        response_format: { "type": "json_object" }
    });
    return chatCompletion;
}

const PORT = 3001 || process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
