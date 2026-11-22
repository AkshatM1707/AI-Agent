
import "dotenv/config";
import OpenAI from "openai";
import axios from "axios";
import {
    Agent,
    run,
    tool,
    setDefaultOpenAIClient,
    setOpenAIAPI,
    setTracingDisabled,
} from "@openai/agents";

import { z } from "zod";

async function main(query) {
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
        throw new Error("GROQ_API_KEY is missing from .env");
    }

    // 1. Configure Groq client
    const groqClient = new OpenAI({
        apiKey: groqApiKey,
        baseURL: "https://api.groq.com/openai/v1",
    });

    setDefaultOpenAIClient(groqClient);
    setOpenAIAPI("chat_completions");
    setTracingDisabled(true);

    // 2. Define the weather tool
    
const getWeather = tool({
    name: "get_weather",
    description: "Get the weather for a given city.",
    parameters: z.object({
        city: z.string(),
    }),

    async execute({ city }) {
        console.log(`Fetching weather for ${city}...`);

        try {
            const url = `https://wttr.in/${encodeURIComponent(city)}?format=%C+%t`;

            const response = await axios.get(url, {
                timeout: 10000,
            });

            const weather = response.data.trim();

            console.log(weather);

            return `The current weather in ${city} is ${weather}.`;

        } catch (error) {
            console.error("Weather API error:", error.message);

            return `Unable to fetch weather information for ${city}.`;
        }
    },
});


    // 3. Create the agent
    const weatherAgent = new Agent({
        name: "Weather Agent",
        instructions: `
      You are a helpful weather assistant.
      When a user asks about weather, use the get_weather tool.
      Provide a clear and concise response.
    `,
        tools: [getWeather],
    });

    // 4. Run the agent
    const result = await run(weatherAgent, query);

    // 5. Display the result
    console.log("\nAgent Response:");
    console.log(result.finalOutput);
}

main("What is the weather in New York City, Goa and Barcelona?")
    .catch((error) => {
        console.error("Agent execution failed:", error);
        process.exitCode = 1;
    });
