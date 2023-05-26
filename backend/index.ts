import express, { Request, Response } from 'express';
import { AnthropicMessage } from './message';
import cors from 'cors';
import {
  Message,
  Session,
  File,
  messageHandler,
  sessionHandler,
  fileHandler,
} from "./data";

const app = express();
const port = 3000;

let anthropicMessage = new AnthropicMessage();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  origin: 'http://localhost:8080', // replace this with the frontend origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true // this allows session cookies to be sent back and forth
}));

app.listen(3001, function () {
  console.log('CORS-enabled server listening on port 3001');
});

app.post('/api/send-message', (req: Request, res: Response) => {
  if (req.body.role === "file") {
    anthropicMessage.send(req.body.message, req.body.role, req.body.filename);
  } else {
    anthropicMessage.send(req.body.message);
  }
  res.json({ status: 'processing started' });
});

app.get('/api/get-current-messages', async (req: Request, res: Response) => {
  const messages = await sessionHandler.findMessages();
  res.json(messages);
});

app.get('/api/stream-updates', (req: Request, res: Response) => {
  // Initialize EventSource connection here...
  if (!anthropicMessage) {
    res.status(400).json({ error: 'No processing has been started' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  anthropicMessage.on('open', (data: { result: string, status: number}) => {
    res.write(`event: open\ndata: ${JSON.stringify(data)}\n\n`);
  });

  anthropicMessage.on('update', (data: { result: string, status: number}) => {
    res.write(`event: update\ndata: ${JSON.stringify(data)}\n\n`);
  });

  anthropicMessage.on('error', (data: { result: string, status: number}) => {
    res.write(`event: error\ndata: ${JSON.stringify(data)}\n\n`);
  });
});

app.get('/api/get-session-names', async (req: Request, res: Response) => {
  const data = await sessionHandler.findAll()
  // {id: name}
  res.json(data);
});

app.get('/api/get-current-session-id', async (req: Request, res: Response) => {
  res.json({ currentSessionId: sessionHandler.currentSessionId });
});

app.get('/api/get-current-model', async (req: Request, res: Response) => {
  const model = await sessionHandler.findModel();
  res.json({ currentModel: model});
});

// create a new session
app.post('/api/create-session', async (req: Request, res: Response) => {
  const session = new Session(req.body.name, req.body.model);
  await sessionHandler.insert(session);
  // console.log("session", session);
  // change to current session
  sessionHandler.currentSessionId = session.id;
  console.log("current session id", sessionHandler.currentSessionId);
  res.json({ status: 'session created' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
