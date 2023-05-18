import { AI_PROMPT, Client, HUMAN_PROMPT } from "./src/index";
// import data.ts
import { Sessions } from "./data";
const claudeApiKey =
  "";

// create data base
let sessions = new Sessions();


const { EventEmitter } = require('events');

class AnthropicMessage extends EventEmitter {
  send(message: string) {
    // Add message to current session
    let message_id = sessions.add_message_current_session("user", message);

    // Get prompt
    let prompt = sessions.get_prompt_current_session();
    let model = sessions.get_model_current_session();

    const client = new Client(claudeApiKey);
    const stream = client.completeStream(
      {
        prompt: `${HUMAN_PROMPT} ${prompt}${AI_PROMPT}`,
        stop_sequences: [HUMAN_PROMPT],
        max_tokens_to_sample: 200,
        model: model,
      },
      {
        onOpen: (response) => {
          console.log("Opened stream, HTTP status code", response.status);
          // Update backend
          sessions.add_message_current_session("assistant", "");
          // Emit an event to the frontend
          this.emit('open', { result: "" , status: 200});
        },
        onUpdate: (completion) => {
          // console.log("Received update", completion);
          // console.log(completion.completion);
          // Update backend
          sessions.update_message_current_session(
            message_id,
            completion.completion
          );
          // Emit an event to the frontend
          // console.log(completion.stop, completion.stop_reason, typeof(completion.stop));
          // console.log(completion.stop === null)
          if(completion.stop === null){
            this.emit('update', { result: completion.completion , status: 201});
          }
          else if (completion.stop_reason === "stop_sequence") {
            this.emit('update', { result: completion.completion , status: 202, stop_reason: completion.stop_reason});
          }
          else {
            this.emit('error', { result: completion.completion , status: 400});
          }
        },
      }
    );
  }
}

export { AnthropicMessage };

