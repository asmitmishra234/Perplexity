import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage,AIMessage } from "langchain";

// Gemini Model
const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-3.6-flash",
  apiKey: process.env.GEMINI_API_KEY,
});

// Mistral Model
const mistralModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});


// Generate normal AI response

export async function generateResponse(messages) {
  const response = await geminiModel.invoke(
    messages.map((msg) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      }

      return new AIMessage(msg.content);
    })
  );

  return response.text;
}


// Generate chat title
export async function generateTitleChat(message) {
  const response = await geminiModel.invoke([
    new SystemMessage(`
      You are a helpful assistant that generates concise and descriptive
      titles for chat conversations.

      The user will provide you with the first message of a chat conversation.
      Generate a title that captures the essence of the conversation in 2-4 words.

      The title should be clear, relevant, and engaging.
      Return ONLY the title. Do not add quotes or explanations.
    `),

    new HumanMessage(`
      Generate a title for a chat conversation based on this first message:

      "${message}"
    `),
  ]);

  return response.text;
}