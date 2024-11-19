import { v4 as uuidv4 } from "uuid";
import { WebSocketServer } from "ws";

export class ChannelManager {
  subscriptions: Map<any, any>;
    channels: Map<any, any>;
  
  constructor() {
    this.channels = new Map();
    this.subscriptions = new Map();
  }

  createChannel(channelId = uuidv4(), data: any) {
    if (this.channels.has(channelId)) {
      throw new Error('Channel already exists');
    }

    const channel = {
      id: channelId,
      nodes: new Map(),
      ...data,
      createdAt: Date.now()
    };

    this.channels.set(channelId, channel);
    this.broadcastEvent(channelId, {
      type: 'channelCreated',
      channel
    });

    return channel;
  }

  updateChannel(channelId: string, updates: any) {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    Object.assign(channel, updates);
    this.broadcastEvent(channelId, {
      type: 'channelUpdated',
      channel
    });

    return channel;
  }

  removeChannel(channelId: string) {
    if (!this.channels.has(channelId)) {
      throw new Error('Channel not found');
    }

    this.broadcastEvent(channelId, {
      type: 'channelRemoved',
      channelId
    });

    this.channels.delete(channelId);
  }

  subscribeClient(ws: any, channelId: string) {
    if (!this.subscriptions.has(ws)) {
      this.subscriptions.set(ws, new Set());
    }
    this.subscriptions.get(ws).add(channelId);

    // Send current channel state
    const channel = this.channels.get(channelId);
    if (channel) {
      ws.send(JSON.stringify({
        type: 'channelState',
        channel
      }));
    }
  }

  unsubscribeClient(ws: any, channelId: string) {
    const subs = this.subscriptions.get(ws);
    if (subs) {
      subs.delete(channelId);
    }
  }

  removeClient(ws: any) {
    this.subscriptions.delete(ws);
  }

  broadcastEvent(channelId: string, event: any) {
    this.subscriptions.forEach((subscribedChannels, ws) => {
      if (subscribedChannels.has(channelId)) {
        ws.send(JSON.stringify(event));
      }
    });
  }
}