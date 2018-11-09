import Vuex from 'vuex';

import { LcuClientWatcher } from './lcu/client_watcher';
import { LcuConnection } from './lcu/connection';
import { LcuEventDispatcher } from './lcu/event_dispatcher';
import { LoginWatcher, LoginWatcherDelegate, LoginWatcherState }
    from './login_watcher';
import { WsConnection, WsConnectionDelegate, WsConnectionState }
    from './ws_connection';

export type UiControllerState =
    'lcu-offline' | 'lcu-online' | WsConnectionState;

export class UiController
    implements WsConnectionDelegate, LoginWatcherDelegate {
  /** Looks for live LCU clients. */
  public readonly clientWatcher: LcuClientWatcher;
  /** LCU status events. */
  public readonly eventDispatcher: LcuEventDispatcher;
  /** Tracks the LCU's client state. */
  public readonly loginWatcher: LoginWatcher;
  public readonly vueStore: any;  // Vuex.Store;
  /** Connection to our WebSockets server. */
  public readonly wsConnection: WsConnection;

  private lastState: UiControllerState;
  /** Last known-good LCU connection. */
  private lcuConnection: LcuConnection | null;
  /** The URL of our WebSockets server.  */
  private readonly wsUrl: string;

  constructor(vueStore: any) {  // Should be Vuex.Store.
    this.eventDispatcher = new LcuEventDispatcher();
    this.lastState = 'lcu-offline';
    this.lcuConnection = null;
    this.loginWatcher = new LoginWatcher(this.eventDispatcher, this);
    this.vueStore = vueStore;
    this.wsUrl = UiController.serverWsUrl();
    this.wsConnection = new WsConnection(this.wsUrl, this);
    this.clientWatcher = new LcuClientWatcher(this.eventDispatcher);

    this.setupDebugLogging();
  }

  public static serverWsUrl(): string {
    if (process.env.NODE_ENV !== 'production') {
      return 'ws://127.0.0.1:3000';
    } else {
      // TODO(pwnall): Real server?.
      return 'wss://example.com';
    }
  }

  /** The last reported state. */
  public state(): UiControllerState { return this.lastState; }

  public setupDebugLogging(): void {
    this.eventDispatcher.addListener(
        'OnJsonApiEvent', (_: string, payload: any) => {
      console.log(payload);
    });
    this.eventDispatcher.addListener(
        'OnLcdsEvent', (_: string, payload: any) =>  {
      console.log(payload);
    });
    // Also available:
    // OnLog, OnRegionLocaleChanged, OnServiceProxyAsyncEvent,
    // OnServiceProxyMethodEvent, OnServiceProxyUuidEvent
  }

  // WsConnectionDelegate
  public onWsStateChange(state: WsConnectionState): void {
    if (this.loginWatcher.state() !== 'lcu-signedin') {
      return;
    }

    this.setState(state);
    if (state === 'challenged') {
      this.authenticate();  // Promise ignored intentionally.
    }
  }

  // LoginWatcherDelegate
  public async onLoginChange(state: LoginWatcherState): Promise<void> {
    console.log(`LoginWatcher state: ${state}`);

    if (state !== 'lcu-signedin') {
      this.lcuConnection = null;
      this.wsConnection.reset();
      this.setState(state);
    }

    // When signed in, the state comes from the WebSocket connection.
    const newState = this.wsConnection.state();
    this.lcuConnection = this.loginWatcher.connection();
    this.setState(newState);
    if (newState === 'challenged') {
      this.authenticate();  // Promise intentionally ignored.
    }
  }

  private async authenticate(): Promise<void> {
    const accountId = this.loginWatcher.accountId().toString();
    const summonerId = this.loginWatcher.summonerId().toString();

    const token = this.wsConnection.token();
    await this.setVerificationToken(
        this.lcuConnection as LcuConnection, summonerId, token as string);

    this.wsConnection.sendAuth(accountId, summonerId);
  }

  private async setVerificationToken(
      connection: LcuConnection, summonerId: string, token: string):
      Promise<void> {
    const url = `/lol-collections/v1/inventories/${summonerId}/verification`;
    await connection.request('PUT', url, token);
  }

  /** Creates a notification in the League clinet (LCU). */
  private async postNotification(
      connection: LcuConnection, expiresInMs: (number | null) = null):
      Promise<number> {
    const now = Date.now();
    const expires: string = (expiresInMs === null) ?
        '' : new Date(now + expiresInMs).toISOString();
    const notificationData = {
      backgroundUrl: '',
      created: (new Date()).toISOString(),
      critical: true,
      data: { mission_title: 'Figure Out LCU' },
      detailKey: 'new_mission_details',
      dismissible: true,
      expires,
      iconUrl: 'https://www.google.com/chrome/static/images/chrome-logo.svg',
      id: 0,
      source: '',
      state: 'unread',
      titleKey: 'new_mission_title',
      type: 'mission',
    };
    const newNotification =
        await connection.request('POST',
                                 '/player-notifications/v1/notifications',
                                 notificationData);
    const notificationId: number = newNotification.id;
    return notificationId;
  }

  private setState(state: UiControllerState): void {
    if (this.lastState === state) {
      return;
    }

    this.lastState = state;
    console.log(['UIController', state]);
    this.vueStore.commit('lcu/setStatus', state);
  }
}
