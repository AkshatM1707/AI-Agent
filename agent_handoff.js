
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

// ============================================
// 1. GROQ CONFIGURATION
// ============================================

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

// Use a Groq-supported model.
// You can override this using GROQ_MODEL in .env.
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";


// ============================================
// 2. DEFINE TOOLS
// ============================================

// SALES TOOL

const fetchAvailablePlans = tool({
    name: "fetchAvailablePlans",

    description: "Fetch available broadband plans.",

    parameters: z.object({
        city: z.string().describe("Customer's city"),
    }),

    execute: async ({ city }) => {

        console.log(`\n[TOOL] Fetching plans for ${city}`);

        // Simulated database response
        return [
            {
                planId: "PLAN001",
                name: "Basic Plan",
                price: 499,
                speed: "10 Mbps",
                data: "100 GB",
            },
            {
                planId: "PLAN002",
                name: "Premium Plan",
                price: 999,
                speed: "100 Mbps",
                data: "Unlimited",
            },
            {
                planId: "PLAN003",
                name: "Ultimate Plan",
                price: 1499,
                speed: "300 Mbps",
                data: "Unlimited",
            },
        ];
    },
});


// REFUND TOOL

const refundPlan = tool({
    name: "refundPlan",

    description: "Process a refund for a customer's broadband plan.",

    parameters: z.object({
        customerId: z.string(),
        planId: z.string(),
        confirmed: z.boolean().describe(
            "Whether the customer explicitly confirmed the refund"
        ),
    }),

    execute: async ({ customerId, planId, confirmed }) => {

        console.log("\n[TOOL] Processing refund");

        if (!confirmed) {
            return {
                success: false,
                message: "Refund not processed. Customer confirmation is required.",
            };
        }

        // Simulated refund operation
        console.log("Customer:", customerId);
        console.log("Plan:", planId);

        return {
            success: true,
            message: "Refund processed successfully.",
        };
    },
});


// TECHNICAL SUPPORT TOOLS

const checkInternetStatus = tool({
    name: "checkInternetStatus",

    description: "Check the internet connection status of a customer.",

    parameters: z.object({
        customerId: z.string(),
    }),

    execute: async ({ customerId }) => {

        console.log(`\n[TOOL] Checking internet for ${customerId}`);

        // Simulated API response
        return {
            customerId,
            status: "Disconnected",
            lastConnected: "10 minutes ago",
            issue: "Router connection timeout",
        };
    },
});


const restartRouter = tool({
    name: "restartRouter",

    description: "Restart a customer's broadband router.",

    parameters: z.object({
        customerId: z.string(),
        confirmed: z.boolean(),
    }),

    execute: async ({ customerId, confirmed }) => {

        if (!confirmed) {
            return {
                success: false,
                message: "Router restart requires customer confirmation.",
            };
        }

        console.log(`\n[TOOL] Restarting router for ${customerId}`);

        return {
            success: true,
            message: "Router restart initiated successfully.",
        };
    },
});


// ============================================
// 3. CREATE SPECIALIST AGENTS
// ============================================


// SALES AGENT

const salesAgent = new Agent({
    name: "Sales Agent",
    model: MODEL,

    instructions: `
        You are a Sales Agent for an internet broadband company.

        YOUR RESPONSIBILITIES:
        - Help customers explore broadband plans.
        - Understand their internet requirements.
        - Compare available plans.
        - Recommend suitable plans.

        TOOL USAGE:
        - Use fetchAvailablePlans to retrieve available plans.
        - Ask for the customer's city if it is missing.
        - Never invent plan prices or specifications.

        HANDOFF RULES:
        - Refund requests must go to Refund Agent.
        - Internet connectivity issues must go to Technical Support Agent.
        - You handle sales and purchasing queries.

        You are a specialist, not a general manager.
    `,

    tools: [fetchAvailablePlans],
});


// REFUND AGENT

const refundAgent = new Agent({
    name: "Refund Agent",
    model: MODEL,

    instructions: `
        You are a Refund Agent for an internet broadband company.

        YOUR RESPONSIBILITIES:
        - Help customers with refunds.
        - Handle plan cancellation and refund requests.
        - Explain refund procedures.

        TOOL USAGE:
        - Use refundPlan to process refunds.
        - Ask for customerId and planId if missing.
        - Obtain explicit customer confirmation before
          invoking the refund tool.
        - Never claim a refund was processed unless
          the tool confirms success.

        HANDOFF RULES:
        - Sales queries go to Sales Agent.
        - Internet connectivity issues go to Technical Support Agent.
        - You handle refund-related queries.
    `,

    tools: [refundPlan],
});


// TECHNICAL SUPPORT AGENT

const technicalSupportAgent = new Agent({
    name: "Technical Support Agent",
    model: MODEL,

    instructions: `
        You are a Technical Support Agent for an internet broadband company.

        YOUR RESPONSIBILITIES:
        - Troubleshoot internet connectivity problems.
        - Check customer internet status.
        - Help resolve router issues.

        TOOL USAGE:
        - Use checkInternetStatus to inspect connectivity.
        - Use restartRouter to restart the router.
        - Ask for customerId if missing.
        - Obtain explicit customer confirmation before
          restarting the router.

        HANDOFF RULES:
        - Sales queries go to Sales Agent.
        - Refund queries go to Refund Agent.
        - You handle technical support queries.
    `,

    tools: [checkInternetStatus, restartRouter],
});


// ============================================
// 4. CONNECT AGENTS THROUGH HANDOFFS
// ============================================

// These are peer-to-peer handoffs.
// There is no central manager agent.

salesAgent.handoffs = [
    refundAgent,
    technicalSupportAgent,
];

refundAgent.handoffs = [
    salesAgent,
    technicalSupportAgent,
];

technicalSupportAgent.handoffs = [
    salesAgent,
    refundAgent,
];


// ============================================
// 5. RUN THE AGENT NETWORK
// ============================================

async function main(query, startingAgent = salesAgent) {

    console.log("\n================================");
    console.log("CUSTOMER QUERY");
    console.log("================================");

    console.log(query);

    const result = await run(startingAgent, query);

    console.log("\n================================");
    console.log("FINAL RESPONSE");
    console.log("================================");

    console.log(result.finalOutput);
}


// ============================================
// 6. EXECUTION
// ============================================

// Start with any specialist.
// The selected agent can hand off to its peers.

main(
    "I am from Mumbai. I want to buy a broadband plan for my home."
).catch((error) => {
    console.error("Agent execution failed:", error);
    process.exitCode = 1;
});
