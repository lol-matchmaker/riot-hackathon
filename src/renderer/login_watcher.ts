import { LcuConnection } from './lcu/connection';
import { LcuEventDispatcher } from './lcu/event_dispatcher';

export interface LoginWatcherDelegate {
  onLoginChange(state: 'offline' | 'online' | 'signedin',
                accountId: number, summonerId: number): void;
}

/** Monitors whether a user logs on or off. */
export class LoginWatcher {
  /** The delegate receives state updates. */
  private readonly delegate: LoginWatcherDelegate;
  /** 0 means no user is logged in. */
  private lastAccountId: number;
  /** 0 means no user is logged in. */
  private lastSummonerId: number;
  /** Last online connection to an LCU client. */
  private lastConnection: LcuConnection | null;
  /** True if an online connection exists. */
  private isConnected: boolean;
  /** The most recent state reported to the delegate. */
  private lastState: 'online' | 'offline' | 'signedin' | null;

  constructor(eventDispatcher: LcuEventDispatcher,
              delegate: LoginWatcherDelegate) {
    this.delegate = delegate;
    this.lastAccountId = 0;
    this.lastConnection = null;
    this.lastSummonerId = 0;
    this.isConnected = false;
    this.lastState = null;

    eventDispatcher.addListener(
        'OnJsonApiEvent_lol-login_v1_session',
        this.onLoginSessionChange.bind(this));
    eventDispatcher.addListener(
        '@-online', this.onConnectionOnline.bind(this));
    eventDispatcher.addListener(
        '@-offline', this.onConnectionOffline.bind(this));
  }

  public accountId(): number { return this.lastAccountId; }
  public connection(): LcuConnection | null { return this.lastConnection; }
  public summonerId(): number { return this.lastSummonerId; }

  private onConnectionOnline(_topic: string, payload: any): void {
    const connection = payload.connection as LcuConnection;
    this.isConnected = true;
    this.lastConnection = connection;
    this.updateLoginSessionFrom(connection);  // Promise intentionally ignored.
  }

  private onConnectionOffline(_topic: string, _payload: LcuConnection): void {
    this.isConnected = false;
    // Client missing, definitely logged out.
    this.updateLoginSession({});
  }

  private async updateLoginSessionFrom(connection: LcuConnection):
      Promise<void> {

    let loginSession: any;
    try {
      loginSession = await connection.request('GET', '/lol-login/v1/session');
    } catch (readError) {
      // Read failures means the client is missing. Therefore, logged out.
      this.updateLoginSession({});
      return;
    }
    this.updateLoginSession(loginSession);
  }

  private onLoginSessionChange(topic: string, payload: any): void {
    if (topic !== 'OnJsonApiEvent_lol-login_v1_session') {
      return;
    }
    const loginSession = payload.data;
    if (typeof loginSession !== 'object') {
      return;
    }
    this.updateLoginSession(loginSession);
  }

  private updateLoginSession(loginSession: any): void {
    const accountId = loginSession.accountId;
    if (typeof accountId !== 'number' || accountId === 0) {
      this.resetLoginSession();
      return;
    }
    const summonerId = loginSession.summonerId;
    if (typeof summonerId !== 'number' || summonerId === 0) {
      this.resetLoginSession();
      return;
    }

    this.lastAccountId = accountId;
    this.lastSummonerId = summonerId;
    this.setState('signedin');
  }

  private resetLoginSession(): void {
    this.lastAccountId = 0;
    this.lastSummonerId = 0;
    this.setState(this.isConnected ? 'online' : 'offline');
  }

  private setState(state: 'offline' | 'online' | 'signedin'): void {
    if (this.lastState === state) {
      return;
    }

    this.lastState = state;
    this.delegate.onLoginChange(state, this.lastAccountId, this.lastSummonerId);
  }
}
