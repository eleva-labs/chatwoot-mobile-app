import { ActionCable, Cable } from '@kesha-antonov/react-native-action-cable';

const channelName = 'RoomChannel';
const PRESENCE_INTERVAL = 20000;

export interface ActionCableEvent<T = unknown> {
  event: string;
  data: T;
}

class BaseActionCableConnector {
  protected events: { [key: string]: (data: unknown) => void };
  protected accountId: number;
  protected cable: InstanceType<typeof Cable>;
  private consumer: ReturnType<typeof ActionCable.createConsumer>;
  private presenceInterval: ReturnType<typeof setInterval> | null = null;

  constructor(pubSubToken: string, webSocketUrl: string, accountId: number, userId: number) {
    this.cable = new Cable({});
    this.consumer = ActionCable.createConsumer(webSocketUrl);

    const channel = this.cable.setChannel(
      channelName,
      this.consumer.subscriptions.create(
        {
          channel: channelName,
          pubsub_token: pubSubToken,
          account_id: accountId,
          user_id: userId,
        },
        {
          updatePresence(): void {
            this.perform('update_presence');
          },
        },
      ),
    );

    channel.on('received', this.onReceived);
    channel.on('connected', this.handleConnected);
    channel.on('disconnect', this.handleDisconnected);

    this.events = {};
    this.accountId = accountId;

    this.presenceInterval = setInterval(() => {
      this.cable.channel(channelName).perform('update_presence');
    }, PRESENCE_INTERVAL);
  }

  disconnect(): void {
    if (this.presenceInterval !== null) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
    this.consumer.disconnect();
  }

  protected isAValidEvent = (data: unknown): boolean => {
    const { account_id } = data as { account_id: number };
    return this.accountId === account_id;
  };

  private onReceived = ({ event, data }: ActionCableEvent = { event: '', data: null }): void => {
    if (this.isAValidEvent(data)) {
      if (this.events[event] && typeof this.events[event] === 'function') {
        this.events[event](data);
      }
    }
  };

  private handleConnected = (): void => {
    console.warn('Connected to ActionCable');
  };

  private handleDisconnected = (): void => {
    console.warn('Disconnected from ActionCable');
  };
}

export default BaseActionCableConnector;
