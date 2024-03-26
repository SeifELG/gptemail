
require("dotenv").config();
const path = require("path");
const express = require("express");
const OpenAI = require('openai');
const marked = require('marked')
const DiffMatchPatch  = require('diff-match-patch')

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const API_PASSWORD = process.env.API_PASSWORD

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


app.post("/proofread", async (req, res) => {
    try {
        console.log(req.body)

        const isGPT4 = req.body.isGPT4;
  
        if(isGPT4 && req.body.password !== API_PASSWORD){
            res.status(200).json({output:"password needed for smarter AI", parsed:"password needed for smarter AI"});
            return
        }

        const email = req.body.prompt;
        const chatCompletion = await fixEmail({ input: email, isGPT4 });
        const chatCompletionContent = chatCompletion.choices[0].message.content;


        const diff = generateDiffHtml(email, chatCompletionContent)

        const returnObject = {
            input: email,
            output: chatCompletionContent,
            parsed: marked.parse(chatCompletionContent),
            diff,
        }

        res.status(200).json(returnObject);
    } catch (error) {
        console.error("Error", error);
        res.status(500).send("An error occurred while processing your request.");
    }
});

async function fixEmail({ input, isGPT4 }) {
    const systemPrompt = "You are a proofreader. You recieve an email as a prompt and return the corrected email. You just return the corrected text and nothing else. You fix spelling and grammar mistakes and any odd words or language that a non-native speaker might get wrong."
    const chatCompletion = await openai.chat.completions.create({
        messages: [ {"role": "system", "content": systemPrompt}, { role: 'user', content: input }],
        model: isGPT4 ? 'gpt-4-turbo-preview' :'gpt-3.5-turbo',
    });
    return chatCompletion;
}






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


        res.status(200).json(JSON.parse(chatCompletion.choices[0].message.content));
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


function generateDiffHtmlOld(original, corrected) {
    // This is a very simplistic approach and might not work well for all cases.
    // For actual projects, consider using a diff library like diff-match-patch.
    
    let result = "";
    const originalWords = original.split(' ');
    const correctedWords = corrected.split(' ');
    
    let i = 0, j = 0;
    while (i < originalWords.length && j < correctedWords.length) {
        if (originalWords[i] === correctedWords[j]) {
            result += originalWords[i] + " ";
            i++;
            j++;
        } else {
            if (i < originalWords.length) {
                result += `<span class="removed">${originalWords[i]}</span> `;
                i++;
            }
            if (j < correctedWords.length) {
                result += `<span class="added">${correctedWords[j]}</span> `;
                j++;
            }
        }
    }
    
    // Handle any remaining words in either the original or corrected texts
    for (; i < originalWords.length; i++) {
        result += `<span class="removed">${originalWords[i]}</span> `;
    }
    for (; j < correctedWords.length; j++) {
        result += `<span class="added">${correctedWords[j]}</span> `;
    }
    
    return result;
}

function generateDiffHtml(original, corrected) {
    const dmp = new DiffMatchPatch();
    let diffs = dmp.diff_main(original, corrected);
    dmp.diff_cleanupSemantic(diffs);

    let html = [];
    diffs.forEach(function([op, data]) {
        let text = data.replace(/\n/g, '<br>').replace(/\n\n/g, '<p></p>');
        switch (op) {
            case 0: // No change
                html.push(`<span>${text}</span>`);
                break;
            case -1: // Deletion
                html.push(`<span class="removed">${text}</span>`);
                break;
            case 1: // Insertion
                html.push(`<span class="added">${text}</span>`);
                break;
        }
    });
    return html.join('');
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}