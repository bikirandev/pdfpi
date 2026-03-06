import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";

/** Shape of a channel object stored in the manager. */
interface Channel {
  id: string;
  nodes: Map<string, unknown>;
  createdAt: number;
  [key: string]: unknown;
}

/**
 * Manages named broadcast channels and the WebSocket clients subscribed to them.
 *
 * Channels are created on demand and live in-memory.  Any connected WebSocket
 * client can subscribe to one or more channels and will receive all events
 * broadcast to those channels in real time.
 */
export class ChannelManager {
  /** Map of channelId → channel data. */
  private channels: Map<string, Channel>;

  /**
   * Map of WebSocket client → set of channel IDs the client is subscribed to.
   */
  private subscriptions: Map<WebSocket, Set<string>>;

  constructor() {
    this.channels = new Map();
    this.subscriptions = new Map();
  }

  /**
   * Creates a new channel with the given ID (defaults to a UUID) and initial
   * data, then broadcasts a `channelCreated` event to all subscribers.
   *
   * @throws If a channel with the same ID already exists.
   */
  createChannel(channelId: string = uuidv4(), data: Record<string, unknown>): Channel {
    if (this.channels.has(channelId)) {
      throw new Error("Channel already exists");
    }

    const channel: Channel = {
      id: channelId,
      nodes: new Map(),
      ...data,
      createdAt: Date.now(),
    };

    this.channels.set(channelId, channel);
    this.broadcastEvent(channelId, { type: "channelCreated", channel });

    return channel;
  }

  /**
   * Merges `updates` into an existing channel and broadcasts a
   * `channelUpdated` event to all subscribers.
   *
   * @throws If the channel does not exist.
   */
  updateChannel(channelId: string, updates: Record<string, unknown>): Channel {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }

    Object.assign(channel, updates);
    this.broadcastEvent(channelId, { type: "channelUpdated", channel });

    return channel;
  }

  /**
   * Removes a channel and broadcasts a `channelRemoved` event before deletion.
   *
   * @throws If the channel does not exist.
   */
  removeChannel(channelId: string): void {
    if (!this.channels.has(channelId)) {
      throw new Error("Channel not found");
    }

    this.broadcastEvent(channelId, { type: "channelRemoved", channelId });
    this.channels.delete(channelId);
  }

  /**
   * Subscribes a WebSocket client to a channel.  If the channel already
   * exists, the current channel state is immediately sent to the client.
   */
  subscribeClient(ws: WebSocket, channelId: string): void {
    if (!this.subscriptions.has(ws)) {
      this.subscriptions.set(ws, new Set());
    }
    this.subscriptions.get(ws)!.add(channelId);

    // Push the current channel state to the newly subscribed client
    const channel = this.channels.get(channelId);
    if (channel) {
      ws.send(JSON.stringify({ type: "channelState", channel }));
    }
  }

  /** Removes a channel subscription from a WebSocket client. */
  unsubscribeClient(ws: WebSocket, channelId: string): void {
    this.subscriptions.get(ws)?.delete(channelId);
  }

  /** Cleans up all subscriptions when a WebSocket client disconnects. */
  removeClient(ws: WebSocket): void {
    this.subscriptions.delete(ws);
  }

  /**
   * Sends `event` as a JSON string to every WebSocket client that is
   * subscribed to `channelId`.
   */
  broadcastEvent(channelId: string, event: Record<string, unknown>): void {
    this.subscriptions.forEach((subscribedChannels, ws) => {
      if (subscribedChannels.has(channelId)) {
        ws.send(JSON.stringify(event));
      }
    });
  }
}