import express, { Request, Response } from 'express';
import { AnthropicMessage } from './message';
import cors from 'cors';

const app = express();
const port = 3000;

let anthropicMessage: AnthropicMessage | null = null;

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
  anthropicMessage = new AnthropicMessage();
  anthropicMessage.send(req.body.message);
  // Send a simple response back. The message processing has started
  res.json({ status: 'processing started' });
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


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
