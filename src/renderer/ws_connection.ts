import WebSocket = require('ws');
import { AuthMessage } from './ws_messages';

export interface WsConnectionDelegate {
  onChallenge(): void;
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
  /** True if the server has accepted our credentials. */
  private authenticated: boolean;
  /** True if we have a socket connected to our server. */
  private isConnected: boolean;
  /** The last challenge token sent by the server. */
  private lastToken: string | null;
  /** ws connection to our server. */
  private socket: WebSocket;

  public constructor(wsUrl: string, delegate: WsConnectionDelegate) {
    this.delegate = delegate;
    this.wsUrl = wsUrl;
    // TODO(pwnall): Better value that doesn't DDOS the server.
    this.reconnectMs = 1000;
    this.authenticated = false;
    this.isConnected = false;
    this.lastToken = null;

    this.socket = this.createSocket();
  }

  /** True if the server has accepted our credentials. */
  public isAuthenticated(): boolean { return this.authenticated; }
  /** The last challenge token sent by the server. */
  public token(): string | null { return this.lastToken; }

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
    return socket;
  }

  private reconnect(): void {
    this.lastToken = null;
    this.authenticated = false;
    this.isConnected = false;
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
        this.lastToken = message.token;
        this.delegate.onChallenge();
        break;
      case 'ready':
        this.authenticated = true;
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
