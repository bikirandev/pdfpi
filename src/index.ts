import cors from "cors";
import http from "http";
import express, { NextFunction, Request, Response } from "express";
import { WebSocketServer } from "ws";
import globalErrorHandler from "./middleware/globalErrorHandler";
import notFound from "./middleware/notFound";
import pdfRoute from "./routes/pdf.route";
import channelRoute from "./routes/channel.route";
import downloadDir from "./utils/downloadDir";
import { ChannelManager } from "./utils/channelManager";
import eventRoute from "./routes/events.route";
import scrapRoute from "./routes/scrap.route";

const app = express();
const port = 7301;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const channelManager = new ChannelManager();

// Ensure downloads directory exists
// const downloadsDir = join(__dirname, "downloads");
// await fs.mkdir(downloadsDir, { recursive: true });

app.use(cors());
app.use(
  express.json({
    limit: "10mb",
  })
);

app.use("/downloads", express.static(downloadDir()));
app.use("/pdf", pdfRoute);
app.use("/api/scraped-data", scrapRoute);
app.use("/channel", channelRoute);
app.use("/events", eventRoute);

// handle 404 errors
app.use((req: Request, res: Response, next: NextFunction): any =>
  notFound(req, res, next)
);

// handle global errors
app.use((err: Error, req: Request, res: Response, next: NextFunction): any =>
  globalErrorHandler(err, req, res, next)
);

// WebSocket connection handling
wss.on("connection", (ws: WebSocketServer) => {
  console.log("New client connected");

  ws.on("message", (message: string) => {
    const data = JSON.parse(message);

    if (data.type === "subscribe") {
      channelManager.subscribeClient(ws, data.channelId);
    } else if (data.type === "unsubscribe") {
      channelManager.unsubscribeClient(ws, data.channelId);
    }
  });

  ws.on("close", () => {
    channelManager.removeClient(ws);
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
