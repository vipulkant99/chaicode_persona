import { OpenAI } from "openai";
import { hitesh_system_instructions } from "./hitesh_system_info";
import { piyush_system_instructions } from "./piyush_system_info";

let messages = [];

export async function AiPersona({ query, bot }) {
  messages.push({
    role: "system",
    content:
      bot === "hitesh"
        ? hitesh_system_instructions
        : piyush_system_instructions,
  });

  messages.push({ role: "user", content: query });

  const client = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
    });

    const rawContent = response.choices[0].message.content;

    let cleaned = rawContent;

    if (cleaned.startsWith("{{") && cleaned.endsWith("}}")) {
      cleaned = cleaned.slice(1, -1);
    }

    const parsedContent = JSON.parse(cleaned);

    messages.push({
      role: "assistant",
      content: JSON.stringify(parsedContent),
    });

    if (parsedContent.step !== "result") {
      continue;
    }

    // if (parsedContent.step === "THINK") {
    //   console.log(`\t🧠`, parsedContent.content);

    //   continue;
    // }

    if (parsedContent.step === "output") {
      messages.push({
        role: "assistant",
        content: JSON.stringify(parsedContent),
      });
      break;
    }
    return parsedContent.content;
  }
}
