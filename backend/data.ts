import { AI_PROMPT, Client, HUMAN_PROMPT } from "./src/index";

// message class
class Message {
  id: string;
  role: string;
  content: string;
  timestamp: number;
  constructor(role: string, content: string) {
    // random generate id for message
    this.id = Math.random().toString(36).substring(7);
    this.role = role; // user / assistant
    this.content = content;
    // timestamp
    this.timestamp = Date.now();
  }
}

// messages class
class Messages {
  messages: Message[];
  session_id: string;
  session_name: string;
  created_at: number;
  model: string;
  constructor() {
    this.messages = [];
    this.session_id = "";
    this.session_name = "";
    this.created_at = Date.now();
    this.model = "claude-v1";
  }
  // add, update, delete, get messages
  add_message(role: string, content: string) {
    let message = new Message(role, content);
    this.messages.push(message);
    return message.id;
  }
  update_message(message_id: string, content: string) {
    for (let i = 0; i < this.messages.length; i++) {
      if (this.messages[i].id == message_id) {
        this.messages[i].content = content;
        break;
      }
    }
  }
  delete_message(message_id: string) {
    for (let i = 0; i < this.messages.length; i++) {
      if (this.messages[i].id == message_id) {
        this.messages.splice(i, 1);
        break;
      }
    }
  }
  get_messages() {
    return this.messages;
  }

  get_prompt() {
    // messages = [{role: "Human", content:"Hello"}]
    let prompt = "";
    for (let i = 0; i < this.messages.length; i++) {
      if (this.messages[i].role == "user") {
        prompt += `${HUMAN_PROMPT} ${this.messages[i].content}`;
      } else {
        prompt += `${AI_PROMPT} ${this.messages[i].content}`;
      }
    }
    // if last message is human, add ai prompt
    if (
      this.messages.length > 0 &&
      this.messages[this.messages.length - 1].role == "user"
    ) {
      prompt += `${AI_PROMPT}`;
    }
    return prompt;
  }
}

// sessions class
class Sessions {
  sessions: { [key: string]: Messages };
  current_session: string;
  models: string[];
  constructor() {
    this.sessions = {};
    this.current_session = "";
    this.create_session();
    this.models = ["claude-v1-100k"];
  }
  // get models
  get_models() {
    return this.models;
  }
  // create empty session
  create_session() {
    let session = new Messages();
    this.sessions[session.session_id] = session;
    this.current_session = session.session_id;
    return session.session_id;
  }
  // set current session
  set_current_session(session_id: string) {
    this.current_session = session_id;
  }
  // get current session
  get_current_session_id() {
    return this.current_session;
  }
  // get current session name
  get_current_session_name() {
    return this.sessions[this.current_session].session_name;
  }

  // add message to session_id session
  add_message(session_id: string, role: string, content: string) {
    // return type : message_id
    return this.sessions[session_id].add_message(role, content);
  }
  // update message to session_id session
  update_message(session_id: string, message_id: string, content: string) {
    this.sessions[session_id].update_message(message_id, content);
  }
  // delete message to session_id session
  delete_message(session_id: string, message_id: string) {
    this.sessions[session_id].delete_message(message_id);
  }
  // get messages from session_id session
  get_messages(session_id: string) {
    return this.sessions[session_id].get_messages();
  }
  // get all sessions
  get_sessions() {
    return this.sessions;
  }
  // get session by session_id
  get_session(session_id: string) {
    return this.sessions[session_id];
  }
  // delete session by session_id
  delete_session(session_id: string) {
    delete this.sessions[session_id];
  }
  // set session name
  set_session_name(session_id: string, session_name: string) {
    this.sessions[session_id].session_name = session_name;
  }

  // Current Session : most useful case
  // add message
  add_message_current_session(role: string, content: string) {
    return this.sessions[this.current_session].add_message(role, content);
  }
  // update message
  update_message_current_session(message_id: string, content: string) {
    this.sessions[this.current_session].update_message(message_id, content);
  }
  // delete message
  delete_message_current_session(message_id: string) {
    this.sessions[this.current_session].delete_message(message_id);
  }
  // get messages
  get_messages_current_session() {
    return this.sessions[this.current_session].get_messages();
  }
  // set model
  set_model_current_session(model: string) {
    if (this.models.includes(model)) {
      this.sessions[this.current_session].model = model;
    } else {
      console.log("Model not found");
    }
  }
  // get prompt
  get_prompt_current_session() {
    return this.sessions[this.current_session].get_prompt();
  }
  // get model
    get_model_current_session() {
    return this.sessions[this.current_session].model;
    }
}

export { Message, Messages, Sessions };
