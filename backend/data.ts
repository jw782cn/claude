import { Database } from "sqlite3";
import { AI_PROMPT, Client, HUMAN_PROMPT } from "./src/index";

// Connect to SQLite database
const db = new Database("sessions.db");

// Initialize the tables in the database
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT,
      created_at INTEGER,
      model TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      role TEXT,
      content TEXT,
      timestamp INTEGER,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    )
  `);
  // create a file data structure with id, name, content, timestamp, tokens, foreigh key(message_id) references messages(id)
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT,
      content TEXT,
      timestamp INTEGER,
      tokens INTEGER,
      message_id TEXT,
      FOREIGN KEY(message_id) REFERENCES messages(id)
    )
  `);
});

// Function to execute SQL queries
function runQuery(query: string, params: any[]): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Function to fetch data from SQL queries
function getData(query: string, params: any[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Message Class for Backend
class Message {
  id: string;
  role: string;
  content: string;
  timestamp: number;
  session_id: string;
  constructor(session_id: string, role: string, content: string, id: string = Math.random().toString(36).substring(7), timestamp: number = Date.now()) {
    this.id = id;
    this.role = role;
    this.content = content;
    this.session_id = session_id;
    this.timestamp = timestamp;
  }
}

// Message SQL queries
class MessageHandler {
  // only help do the SQL queries
  // no need to create a new instance

  // insert, update, delete, find
  async insert(message: Message) {
    await runQuery(
      "INSERT INTO messages (id, session_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)",
      [message.id, message.session_id, message.role, message.content, message.timestamp]
    );
  }

  async update(message_id: string, content: string) {
    await runQuery("UPDATE messages SET content = ? WHERE id = ?", [
      content,
      message_id,
    ]);
  }

  async delete(message_id: string) {
    await runQuery("DELETE FROM messages WHERE id = ?", [message_id]);
  }

  async findBySession(session_id: string) {
    const rows = await getData(
      "SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC",
      [session_id]
    );
    return rows.map(
      (row) => new Message(row.session_id, row.role, row.content, row.id, row.timestamp)
    );
  }

  async findByMessageId(message_id: string) {
    const rows = await getData("SELECT * FROM messages WHERE id = ?", [
      message_id,
    ]);
    if (rows.length > 0) {
      const row = rows[0];
      return new Message(row.session_id, row.role, row.content, row.id, row.timestamp);
    } else {
      return null;
    }
  }

  // if role == "file", find current message's file
  async findMessageFile(message_id: string) {
    const rows = await getData("SELECT * FROM files WHERE message_id = ?", [
      message_id,
    ]);
    if (rows.length > 0) {
      const row = rows[0];
      // console.log("findMessageFile", row);
      return new File(
        row.name,
        row.content,
        row.tokens,
        row.message_id,
        row.id,
        row.timestamp
      );
    } else {
      return null;
    }
  }
}


// Session Class
class Session {
  id: string;
  name: string;
  created_at: number;
  model: string;
  constructor(name: string = "New Session", model: string = "claude-v1-100k", id: string = Math.random().toString(36).substring(7), created_at: number = Date.now()) {
    this.id = id;
    this.name = name;
    this.created_at = created_at;
    this.model = model;
  }
}

// Session SQL queries
class SessionHandler {
  // only help do the SQL queries
  // no need to create a new instance

  currentSessionId: string = "";
  constructor() {
    this.checkCurrentSessionId();
  }

  async checkCurrentSessionId() {
    if (this.currentSessionId === "") {
      // find the latest session, use findAll
      // sessions : { [id: string]: string]}
      const sessions = await this.findAll();
      if ( Object.keys(sessions).length > 0) {
        this.currentSessionId = Object.keys(sessions)[Object.keys(sessions).length - 1];
      } else {
        // create a new session
        const session = new Session();
        await this.insert(session);
        this.currentSessionId = session.id;
      }
      console.log("currentSessionId", this.currentSessionId);
    }
  }

  // insert, update, delete, find
  async insert(session: Session) {
    await runQuery(
      "INSERT INTO sessions (id, name, created_at, model) VALUES (?, ?, ?, ?)",
      [session.id, session.name, session.created_at, session.model]
    );
  }

  async updateModel(model: string, session_id: string = this.currentSessionId) {
    if (session_id === this.currentSessionId) {
      await this.checkCurrentSessionId();
    }
    await runQuery("UPDATE sessions SET model = ? WHERE id = ?", [
      model,
      session_id,
    ]);
  }

  async updateName(name: string, session_id: string = this.currentSessionId) {
    if (session_id === this.currentSessionId) {
      await this.checkCurrentSessionId();
    }
    await runQuery("UPDATE sessions SET name = ? WHERE id = ?", [
      name,
      session_id,
    ]);
  }

  async delete(session_id: string = this.currentSessionId) {
    if (session_id === this.currentSessionId) {
      await this.checkCurrentSessionId();
    }
    await runQuery("DELETE FROM sessions WHERE id = ?", [session_id]);
    if (session_id === this.currentSessionId) {
      this.currentSessionId = "";
      await this.checkCurrentSessionId();
    }
  }

  async find(session_id: string = this.currentSessionId) {
    if (session_id === this.currentSessionId) {
      await this.checkCurrentSessionId();
    }
    const rows = await getData("SELECT * FROM sessions WHERE id = ?", [
      session_id,
    ]);
    if (rows.length > 0) {
      const row = rows[0];
      return new Session(row.name, row.model, row.id, row.created_at);
    } else {
      return null;
    }
  }


  // find all messages
  async findMessages(session_id: string = this.currentSessionId) {
    if (session_id === this.currentSessionId) {
      await this.checkCurrentSessionId();
    }
    const rows = await getData(
      "SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC",
      [session_id]
    );
    return rows.map(
      (row) => new Message(row.session_id, row.role, row.content, row.id, row.timestamp)
    );
  }

  // find all sessions, return {id: name}
  async findAll() {
    const rows = await getData(
      "SELECT id, name FROM sessions ORDER BY created_at ASC",
      []
    );
    // { session_id1 : name1, session_id2 : name2 }
    const sessions : {[key: string]: string} = {};
    for (const row of rows) {
      sessions[row.id] = row.name;
    }
    return sessions;
  }

  // find session's model
  async findModel(session_id: string = this.currentSessionId) {
    if (session_id === this.currentSessionId) {
      await this.checkCurrentSessionId();
    }
    const rows = await getData("SELECT model FROM sessions WHERE id = ?", [
      session_id,
    ]);
    // console.log("rows", rows);
    if (rows.length > 0) {
      const row = rows[0];
      return row.model;
    } else {
      return null;
    }
  }
}


// file class
class File {
  id: string;
  name: string;
  content: string;
  timestamp: number;
  tokens: number;
  message_id: string;
  constructor(
    name: string,
    content: string,
    tokens: number,
    message_id: string,
    id: string = Math.random().toString(36).substring(7),
    timestamp: number = Date.now()
  ) {
    this.id = id;
    this.name = name;
    this.content = content;
    this.timestamp = timestamp;
    this.tokens = tokens;
    this.message_id = message_id;
  }
}

// File SQL queries
class FileHandler {
  // only help do the SQL queries
  // no need to create a new instance

  // insert, update, delete, find
  async insert(file: File) {
    await runQuery(
      "INSERT INTO files (id, name, content, timestamp, tokens, message_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        file.id,
        file.name,
        file.content,
        file.timestamp,
        file.tokens,
        file.message_id,
      ]
    );
  }

  // delete
  async delete(file_id: string) {
    await runQuery("DELETE FROM files WHERE id = ?", [file_id]);
  }
}

const sessionHandler = new SessionHandler();
const messageHandler = new MessageHandler();
const fileHandler = new FileHandler();

export { Message, Session, File, sessionHandler, messageHandler, fileHandler};
