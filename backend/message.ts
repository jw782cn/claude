import { AI_PROMPT, Client, HUMAN_PROMPT } from "./src/index";
import {
  Message,
  Session,
  File,
  messageHandler,
  sessionHandler,
  fileHandler,
} from "./data";
import { EventEmitter } from "events";
// read .env variables from ../.env CLAUDE_API_KEY

require("dotenv").config({ path: "../.env" });
const claudeApiKey = process.env.CLAUDE_API_KEY || "";
console.log(claudeApiKey);

// only help do sending messages to anthropic
// handling streaming
class AnthropicMessage extends EventEmitter {
  async send(message: string, role: string = "user", filename: string = "") {
    let messageInstance: Message;
    let fileInstance: File;
    let aiMessage: Message;
    const client = new Client(claudeApiKey);
    const model = await sessionHandler.findModel();

    // Back-end logic
    // 1. create message object
    messageInstance = new Message(
      sessionHandler.currentSessionId,
      role,
      role === "file" ? filename : message
    );
    // 2. save message object
    await messageHandler.insert(messageInstance);
    // if role is file, assemble file object
    if (role === "file") {
      // 3. create file object
      // console.log(message, role, filename);
      fileInstance = new File(filename, message, 0, messageInstance.id);
      // 4. save file object
      await fileHandler.insert(fileInstance);
    }

    // assemble prompt
    const messages = await sessionHandler.findMessages();
    const prompt = await this.formatPrompt(messages);

    // Send to anthropic
    const stream = client.completeStream(
      {
        prompt: prompt,
        stop_sequences: [HUMAN_PROMPT],
        max_tokens_to_sample: 10000,
        model: model,
      },
      {
        onOpen: async (response) => {
          console.log("Opened stream, HTTP status code", response.status);
          console.log("Using model", model);
          // 1. create message object
          aiMessage = new Message(sessionHandler.currentSessionId, "assistant", "");
          // 2. save message object
          await messageHandler.insert(aiMessage);
          // Emit an event to the frontend
          this.emit("open", { result: "", status: 200 });
        },
        onUpdate: async (completion) => {
          // Emit an event to the frontend
          if (completion.stop === null) {
            this.emit("update", { result: completion.completion, status: 201 });
          } else if (completion.stop_reason === "stop_sequence") {
            console.log("Received stop sequence, closing stream");
            // Back-end logic
            await messageHandler.update(aiMessage.id, completion.completion);
            // front-end logic
            this.emit("update", {
              result: completion.completion,
              status: 202,
              stop_reason: completion.stop_reason,
            });
          } else {
            console.log("Received unknown stop reason, closing stream");
            this.emit("error", { result: completion.completion, status: 400 });
          }
        },
      }
    );
  }

  async formatPrompt(messages: Message[]) {
    // Construct prompt
    let prompt = "";
    for (let message of messages) {
      if (message.role === "assistant") {
        prompt += `${AI_PROMPT} ${message.content}`;
      } else if (message.role === "user") {
        prompt += `${HUMAN_PROMPT} ${message.content}`;
      } else if (message.role === "file") {
        // find file first
        const file = await messageHandler.findMessageFile(message.id);
        // console.log(file);
        if (file) {
          prompt += `${HUMAN_PROMPT} \n=== START FILE\nFile: ${file.name}\n\n${file.content}\n END FILE===\n`;
        }
      }
      if (
        messages.length > 0 &&
        messages[messages.length - 1].role != "assistant"
      ) {
        prompt += `${AI_PROMPT}`;
      }
    }
    // console.log("Prompt:", prompt);
    return prompt;
  }
}

export { AnthropicMessage };
