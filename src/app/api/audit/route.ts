// File: app/api/customize/route.ts

import { NextResponse } from "next/server"

const backendURL = process.env.BACKEND_URL

interface ContentPart {
  text: string
}

interface Content {
  parts: ContentPart[]
  role: string
}

interface RequestBody {
  messages: Content[]
}

/**
 * Extracts content from a code fence regardless of the language tag.
 */
function extractJSON(response: string): string {
  const regex = /```(?:\w+)?\s*([\s\S]*?)\s*```/
  const match = response.match(regex)
  return match && match[1] ? match[1].trim() : response.trim()
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Parse the incoming JSON payload
    const { messages } = (await request.json()) as RequestBody
    if (!messages || !Array.isArray(messages) || messages.length < 2) {
      return NextResponse.json(
        { error: "Invalid payload: must include instructions and file content." },
        { status: 400 }
      )
    }

    // Combine all messages except the last one as the system prompt (audit instructions)
    const systemPrompt = messages
      .slice(0, messages.length - 1)
      .map((msg) => msg.parts.map((part) => part.text).join(" "))
      .join("\n")

    // The last message is treated as the user prompt (Solidity file content)
    const userPrompt = messages[messages.length - 1].parts.map((part) => part.text).join(" ")

    // Load the audit agent from the backend.
    const loadResponse = await fetch(`${backendURL}/agents/example/load`, {
      method: "POST",
    })
    if (!loadResponse.ok) {
      throw new Error(`Failed to load audit agent. Status: ${loadResponse.status} - ${await loadResponse.text()}`)
    }
    console.log("Audit agent loaded successfully!")

    // Call the agent's action endpoint to generate the audit analysis.
    const actionResponse = await fetch(`${backendURL}/agent/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        connection: "gemini",
        action: "generate-text",
        params: [userPrompt, systemPrompt, JSON.stringify([])],
      }),
    })

    if (!actionResponse.ok) {
      const errorText = await actionResponse.text()
      throw new Error(`Agent action failed with status ${actionResponse.status}: ${errorText}`)
    }

    const responseData = await actionResponse.json()

    if (!responseData.result) {
      throw new Error("No result returned from agent action.")
    }

    // Extract text from code fences (whether it's tagged as json or markdown)
    const extracted = extractJSON(responseData.result)
    let parsed
    try {
      // Attempt to parse the extracted text as JSON
      parsed = JSON.parse(extracted)
    } catch (e) {
      console.error("JSON parse error, falling back to markdown:", e)
      // Fallback: wrap the markdown text in an object so that valid JSON is returned
      parsed = { markdown: extracted }
    }
    console.log("Parsed result:", parsed)

    return NextResponse.json({ result: parsed }, { status: 200 })
  } catch (error: IError) {
    console.error("Error processing audit instructions:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
