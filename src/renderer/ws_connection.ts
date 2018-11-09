import WebSocket = require('ws');
import { AuthMessage, CancelQueueMessage, MatchedMessagePlayerInfo,
         RequestQueueMessage, WsMessage } from './ws_messages';

export type WsConnectionState =
    'connecting' | 'challenged' | 'ready' | 'queued' | 'matched';

export interface WsConnectionDelegate {
  onWsStateChange(state: WsConnectionState): void;
}

/** WebSocket connection to our server. */
export class WsConnection {
  /** The delegate gets notified of connection changes. */
  private readonly delegate: WsConnectionDelegate;
  /** WebSocket URL for our server. */
  private readonly wsUrl: string;
  /** Number of ms between WebSocket reconnection attempts. */
  private readonly reconnectMs: number;
  /** Last reported state. */
  private lastState: WsConnectionState;
  /** The last challenge token sent by the server. */
  private lastToken: string | null;
  /** The last match-making information sent by the server. */
  private lastMatchData: MatchedMessagePlayerInfo[] | null;
  /** ws connection to our server. */
  private socket: WebSocket;

  public constructor(wsUrl: string, delegate: WsConnectionDelegate) {
    this.delegate = delegate;
    this.wsUrl = wsUrl;
    // TODO(pwnall): Better value that doesn't DDOS the server.
    this.reconnectMs = 1000;
    this.lastToken = null;
    this.lastState = 'connecting';
    this.lastMatchData = null;

    this.socket = this.createSocket();
  }

  /** True if the server has accepted our credentials. */
  public state(): WsConnectionState { return this.lastState; }
  /** The last challenge token sent by the server. */
  public token(): string | null { return this.lastToken; }
  /** The last match-making information sent by the server. */
  public matchData(): MatchedMessagePlayerInfo[] | null {
    return this.lastMatchData;
  }

  /** Tells the server that we've set the summoner verification string. */
  public sendAuth(accountId: string, summonerId: string): void {
    if (this.lastState === 'connecting') {
      throw new Error('Server WS not connected!');
    }
    const message: AuthMessage = { type: 'auth', accountId, summonerId };
    this.socket.send(JSON.stringify(message));
  }

  /** Asks the server to queue us up. */
  public requestQueue(data:any): void {
    if (this.lastState !== 'ready') {
      throw new Error('Not a good time to queue');
    }
    const message: RequestQueueMessage = { type: 'plsqueue', data: data};
    this.socket.send(JSON.stringify(message));
  }

  /** Asks the server to remove us from the match-making queue. */
  public cancelQueue(): void {
    if (this.lastState !== 'queued') {
      throw new Error('No queue to get off of');
    }
    const message: CancelQueueMessage = { type: 'noqueue' };
    this.socket.send(JSON.stringify(message));
  }

  /** Signals the server that the LCU client is no longer online. */
  public reset(): void {
    if (this.lastState === 'connecting' || this.lastState === 'challenged') {
      return;
    }
    // The socket will be closed, forcing a reset on the server side.
    this.socket.close();
  }

  /** (Re)opens a WebSocket connection to the server. */
  private createSocket(): WebSocket {
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
    this.socket = this.createSocket();
  }

  private onWsClose(_: CloseEvent): void {
    console.log('Server WS closed');
    this.lastToken = null;
    this.setState('connecting');
    setTimeout(this.reconnect.bind(this), this.reconnectMs);
  }

  private onWsError(error: Error): void {
    console.error('Server WS error');
    console.error(error);
  }

  private onWsMessage(event: MessageEvent): void {
    const message: WsMessage  = JSON.parse(event.data);
    console.log(message);

    switch (message.type) {
      case 'challenge':
        this.lastToken = message.token;
        this.setState('challenged');
        break;
      case 'ready':
        this.setState('ready');
        break;
      case 'queued':
        this.setState('queued');
        break;
      case 'dequeued':
        this.setState('ready');
        break;
      case 'matched':
        this.lastMatchData = message.players;
        this.setState('matched');
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

  private setState(state: WsConnectionState): void {
    if (this.lastState === state) {
      return;
    }
    this.lastState = state;
    this.delegate.onWsStateChange(state);
  }
}
