import cors from "cors";
import http from "http";
import express, { NextFunction, Request, Response } from "express";
import { WebSocketServer } from "ws";
import globalErrorHandler from "./middleware/globalErrorHandler";
import notFound from "./middleware/notFound";
import PdfRoute from "./app/pdf.route";
import ChannelRoute from "./app/channel.route";
import downloadDir from "./utils/downloadDir";
import { ChannelManager } from "./utils/channelManager";

const app = express();
const port = 7301;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const channelManager = new ChannelManager();

// Ensure downloads directory exists
// const downloadsDir = join(__dirname, "downloads");
// await fs.mkdir(downloadsDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use("/downloads", express.static(downloadDir()));
app.use("/pdf", PdfRoute);
app.use("/channel", ChannelRoute);

// handle 404 errors
app.use((req: Request, res: Response, next: NextFunction): any =>
  notFound(req, res, next)
);

// handle global errors
app.use((err: Error, req: Request, res: Response, next: NextFunction): any =>
  globalErrorHandler(err, req, res, next)
);


// WebSocket connection handling
wss.on('connection', (ws: WebSocketServer) => {
  console.log('New client connected');

  ws.on('message', (message: string) => {
    const data = JSON.parse(message);
    
    if (data.type === 'subscribe') {
      channelManager.subscribeClient(ws, data.channelId);
    } else if (data.type === 'unsubscribe') {
      channelManager.unsubscribeClient(ws, data.channelId);
    }
  });

  ws.on('close', () => {
    channelManager.removeClient(ws);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


export default app;
