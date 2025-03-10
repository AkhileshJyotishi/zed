// File: app/api/customize/route.ts

import { NextResponse } from "next/server"

const backendURL = process.env.BACKEND_URL

interface MessagePart {
  text: string
}

interface Content {
  parts: MessagePart[]
  role: string
}

interface RequestBody {
  messages: Content[]
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Parse the JSON payload from the frontend
    const body: RequestBody = await request.json()
    const { messages } = body
    if (!messages || !Array.isArray(messages) || messages.length < 1) {
      throw new Error("Invalid messages payload.")
    }

    console.log("Received messages:", messages)

    // Assume the first message (e.g., from GenerateInstructions) is the prompt with all instructions
    const systemPrompt = messages[0].parts
      .map((part) => part.text)
      .join(" ")
      .trim()

    // Combine the rest of the messages as the context (user prompt)
    const userPrompt = messages
      .slice(1)
      .map((msg) =>
        msg.parts
          .map((part) => part.text)
          .join(" ")
          .trim()
      )
      .join("\n")
      .trim()

    console.log("systemPrompt: ", systemPrompt)
    console.log("userPrompt: ", userPrompt)
    // Load the code-completion agent
    const loadResponse = await fetch(`${backendURL}/agents/example/load`, {
      method: "POST",
    })

    if (!loadResponse.ok) {
      throw new Error(
        `Failed to load code-completion agent. Status: ${loadResponse.status} - ${await loadResponse.text()}`
      )
    }
    console.log("Agent 'code-completion' loaded successfully!")

    // Call the agent action endpoint with the constructed prompts
    const actionResponse = await fetch(`${backendURL}/agent/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connection: "gemini",
        action: "generate-text",
        // The agent is expecting a user prompt and a system prompt (with instructions).
        params: [userPrompt, systemPrompt, JSON.stringify([])],
      }),
    })
    console.log("response of zerepy: ", actionResponse)
    if (!actionResponse.ok) {
      const errorText = await actionResponse.text()
      throw new Error(`Agent action failed with status ${actionResponse.status}: ${errorText}`)
    }
    const responseData = await actionResponse.json()
    console.log("response of zerepy: ", responseData)

    if (!responseData.result) {
      throw new Error("No result returned from agent action.")
    }

    return NextResponse.json({ result: responseData.result }, { status: 200 })
  } catch (err: IError) {
    console.error("Error processing code completion request:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
