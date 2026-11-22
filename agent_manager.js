
import "dotenv/config";
import OpenAI from "openai";

import {
    Agent,
    run,
    tool,
    setDefaultOpenAIClient,
    setOpenAIAPI,
    setTracingDisabled,
} from "@openai/agents";

import { z } from "zod";

// ==========================================
// 1. Configure Groq
// ==========================================

async function main(query) {

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


    // ==========================================
    // 2. Define Tools
    // ==========================================

    // Tool 1: Fetch Available Plans

    const fetchAvailablePlans = tool({
        name: "fetchAvailablePlans",

        description: "Fetch available broadband plans for a customer.",

        parameters: z.object({
            customerId: z.string().describe("The ID of the customer"),
        }),

        execute: async ({ customerId }) => {

            console.log("\n[Tool] Fetching available plans...");
            console.log("Customer ID:", customerId);

            // Simulated database response
            return [
                {
                    planId: "PLAN001",
                    name: "Basic Plan",
                    price: 499,
                    bandwidth: "100 GB",
                    speed: "10 Mbps",
                },
                {
                    planId: "PLAN002",
                    name: "Premium Plan",
                    price: 999,
                    bandwidth: "Unlimited",
                    speed: "100 Mbps",
                },
                {
                    planId: "PLAN003",
                    name: "Ultimate Plan",
                    price: 1499,
                    bandwidth: "Unlimited",
                    speed: "300 Mbps",
                },
            ];
        },
    });


    // Tool 2: Refund Plan

    const refundPlan = tool({
        name: "refundPlan",

        description: "Process a refund for a customer's broadband plan.",

        parameters: z.object({
            customerId: z.string().describe("The ID of the customer"),
            planId: z.string().describe("The ID of the plan to refund"),
        }),

        execute: async ({ customerId, planId }) => {

            console.log("\n[Tool] Processing refund...");
            console.log("Customer ID:", customerId);
            console.log("Plan ID:", planId);

            // Simulated refund operation
            return {
                success: true,
                customerId,
                planId,
                message: "Plan refund processed successfully.",
            };
        },
    });


    // ==========================================
    // 3. Create Specialist Agents
    // ==========================================

    // Sales Agent

    const salesAgent = new Agent({
        name: "Sales Agent",

        instructions: `
            You are a sales agent for an internet broadband company.

            Your responsibilities:
            1. Help customers find suitable broadband plans.
            2. Ask for their customer ID if it is missing.
            3. Use fetchAvailablePlans to retrieve available plans.
            4. Explain the plans, prices and speeds.
            5. Recommend a suitable plan based on their needs.

            Do not invent plan details.
            Always use the tool when fetching available plans.
        `,

        tools: [fetchAvailablePlans],
    });


    // Refund Agent

    const refundAgent = new Agent({
        name: "Refund Agent",

        instructions: `
            You are a refund agent for an internet broadband company.

            Your responsibilities:
            1. Help customers with broadband plan refunds.
            2. Ask for customer ID if it is missing.
            3. Ask for plan ID if it is missing.
            4. Explain the refund process.

            Before processing a refund:
            - Explain that the refund will be initiated.
            - Obtain explicit customer confirmation.
            - Only then call refundPlan.

            Do not invent refund details.
        `,

        tools: [refundPlan],
    });


    // ==========================================
    // 4. Create Main Customer Service Agent
    // ==========================================

    const customerServiceAgent = new Agent({
        name: "Customer Service Agent",

        instructions: `
            You are the primary customer service agent
            for an internet broadband company.

            Your job is to understand customer requests
            and route them to the correct specialist.

            Routing rules:

            1. SALES:
               If the customer wants to:
               - Purchase a broadband plan.
               - Explore available plans.
               - Compare plans.
               - Upgrade their plan.

               Hand off to the Sales Agent.

            2. REFUNDS:
               If the customer wants to:
               - Request a refund.
               - Cancel a plan and request money back.
               - Check refund-related issues.

               Hand off to the Refund Agent.

            3. GENERAL:
               For general questions, answer politely yourself.

            IMPORTANT:
            - Do not handle sales or refund operations yourself.
            - Use the appropriate handoff.
            - Do not invent customer or plan information.
        `,

        handoffs: [salesAgent, refundAgent],
    });


    // ==========================================
    // 5. Run Customer Service Agent
    // ==========================================

    console.log("\nCustomer Query:", query);

    const result = await run(customerServiceAgent, query);

    console.log("\n================================");
    console.log("FINAL AGENT RESPONSE");
    console.log("================================");

    console.log(result.finalOutput);
}


// ==========================================
// 6. Execute
// ==========================================

main(
    "I am a customer and I want to buy a broadband plan for my home. I am in Mumbai and I need a plan.My customer ID is 1234567890 and I want to buy the plan with ID PLAN001."
).catch((error) => {
    console.error("Agent execution failed:", error);
    process.exitCode = 1;
});
