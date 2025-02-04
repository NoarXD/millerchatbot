const line = require("@line/bot-sdk");
const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
// const env = dotenv.config().parsed;
const port = process.env.PORT || 8080;

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

const chat = model.startChat({
    history: [
        {
            role: "user",
            parts: [
                {
                    text: "ไม่ต้องใช้ข้อความ Markdown ตัวอย่างเช่น (**บทที่หนึ่ง**), ให้คำตอบที่เป็นข้อความธรรมดาเท่านั้น, ไม่ต้องใส่เครื่องหมายพิเศษ เช่น * หรือ ** ในข้อความตอบกลับ ซึ่งอาจทำให้ข้อความดูไม่เรียบร้อย",
                },
            ],
        },
        {
            role: "model",
            parts: [
                {
                    text: "ได้เลยค่ะ",
                },
            ],
        },
    ],
});

const lineConfig = {
    channelAccessToken: process.env.TOKEN,
    channelSecret: process.env.SECRETCODE,
};

// Initialize the LINE client correctly
const client = new line.Client(lineConfig);

app.post("/webhook", line.middleware(lineConfig), async (req, res) => {
    try {
        const events = req.body.events;
        console.log("event=>>>", events);
        return events.length > 0
            ? await Promise.all(events.map(handleEvent))
            : res.status(200).send("ok");
    } catch (err) {
        res.status(500).end();
    }
});

const handleEvent = async (event) => {
    try {
        const prompt = event.message.text;
        const result = await chat.sendMessage(prompt);
        await client.replyMessage(event.replyToken, {
            type: "text",
            text: result.response.text(),
        });
    } catch (error) {
        console.error("Error sending reply:", error);
    }
};

app.get("/", (req, res) => {
    res.send("ok");
});

app.listen(port, () => console.log("Start server on port 8080"));
