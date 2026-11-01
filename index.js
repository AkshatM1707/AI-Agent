
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

    // Configure Groq as the LLM provider
    const groqClient = new OpenAI({
        apiKey: groqApiKey,
        baseURL: "https://api.groq.com/openai/v1",
    });

    setDefaultOpenAIClient(groqClient);

    // Use Chat Completions instead of OpenAI Responses API
    setOpenAIAPI("chat_completions");

    // Disable OpenAI tracing while using Groq
    setTracingDisabled(true);

    const helloAgent = new Agent({
        name: "Hello Agent",
        instructions:
            "You are an agent that always says hello world and nothing else.",
        model: "openai/gpt-oss-20b",
    });

    const result = await run(helloAgent, "Hey there!");

    console.log("\nAgent response:");
    console.log(result.finalOutput);
}

main().catch((error) => {
    console.error("Agent execution failed:");
    console.error(error);
    process.exitCode = 1;
});
