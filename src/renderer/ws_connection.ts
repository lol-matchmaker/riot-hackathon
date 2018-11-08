import WebSocket = require('ws');
import { AuthMessage } from './ws_messages';

export interface WsConnectionDelegate {
  onChallenge(token: string): void;
  onReady(): void;
}

/** WebSocket connection to our server. */
export class WsConnection {
  /** The delegate gets notified of connection changes. */
  private readonly delegate: WsConnectionDelegate;
  /** WebSocket URL for our server. */
  private readonly wsUrl: string;
  /** Number of ms between WebSocket reconnection attempts. */
  private readonly reconnectMs: number;
  /** True if we have a socket connected to our server. */
  private isConnected: boolean;
  /** ws connection to our server. */
  private socket: WebSocket;

  public constructor(wsUrl: string, delegate: WsConnectionDelegate) {
    this.delegate = delegate;
    this.wsUrl = wsUrl;
    // TODO(pwnall): Better value that doesn't DDOS the server.
    this.reconnectMs = 1000;
    this.isConnected = false;

    this.socket = this.createSocket();
  }

  /** Tells the server that we've set the summoner verification string. */
  public sendAuth(accountId: string, summonerId: string): void {
    if (!this.isConnected) {
      throw new Error('Server WS not connected!');
    }
    const message: AuthMessage = { type: 'auth', accountId, summonerId };
    this.socket.send(JSON.stringify(message));
  }

  /** (Re)opens a WebSocket connection to the server. */
  private createSocket(): WebSocket {
    if (this.isConnected) {
      throw new Error('Server WS already connected');
    }
    const socket: WebSocket = new WebSocket(this.wsUrl, 'lolhack', {
      rejectUnauthorized: false,
    });
    socket.onclose = this.onWsClose.bind(this);
    socket.onerror = this.onWsError.bind(this);
    socket.onmessage = this.onWsMessage.bind(this);
    socket.onopen = this.onWsOpen.bind(this);
    return this.socket;
  }

  private reconnect(): void {
    this.socket = this.createSocket();
  }

  private onWsClose(_: CloseEvent): void {
    console.log('Server WS closed');
    this.isConnected = false;
    setTimeout(this.reconnect.bind(this), this.reconnectMs);
  }

  private onWsError(error: Error): void {
    console.error('Server WS error');
    console.error(error);
  }

  private onWsMessage(event: MessageEvent): void {
    const message = JSON.parse(event.data);
    console.log(message);

    switch (message.type) {
      case 'challenge':
        this.isConnected = true;
        this.delegate.onChallenge(message.token);
        break;
      case 'ready':
        this.delegate.onReady();
        break;
      default:
        console.error('Unknown message from Server WS. Pls update client?');
        console.error(message);
        return;
    }
  }

  private onWsOpen(): void {
    console.log('Server WS open');
  }

}
