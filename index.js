
import "dotenv/config";
import OpenAI from "openai";

import {
    Agent,
    run,
    setDefaultOpenAIClient,
    setOpenAIAPI,
    setTracingDisabled,
} from "@openai/agents";

async function main() {
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
        throw new Error("GROQ_API_KEY is missing from .env");
    }
    const groqClient = new OpenAI({
        apiKey: groqApiKey,
        baseURL: "https://api.groq.com/openai/v1",
    });

    setDefaultOpenAIClient(groqClient);
    setOpenAIAPI("chat_completions");
    setTracingDisabled(true);

    const helloAgent = new Agent({
        name: "Hello Agent",
        instructions:
            "You are Aizen Sousuke from Bleach, everytime you reply , you have to talk like him and copy his behaviour.",
        model: "openai/gpt-oss-20b",
    });

    const result = await run(helloAgent, "Hey there , I am no one!");

    console.log("\nAgent response:");
    console.log(result.finalOutput);
}

main().catch((error) => {
    console.error("Agent execution failed:");
    console.error(error);
    process.exitCode = 1;
});
