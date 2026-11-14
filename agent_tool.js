import "dotenv/config";
import OpenAI from "openai";

import {
    Agent,
    run,
    setDefaultOpenAIClient,
    setOpenAIAPI,
    setTracingDisabled,
} from "@openai/agents";

async function main(query = "") {
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
    setOpenAIAPI("chat_completions");
    setTracingDisabled(true);

    const agent = new Agent({
        name: "Weather Agent",
        instructions: `
        You are an expert weather agent that helps user to tell weather report.
        `,
    });

    const result = await run(agent, query);
    console.log(`Result:`, result.finalOutput);
}

main(`What is the weather of Greater Noida ?`).catch((error) => {
    console.error("Agent execution failed:");
    console.error(error);
    process.exitCode = 1;
});
