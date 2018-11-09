import Vuex from 'vuex';

import { LcuClientWatcher } from './lcu/client_watcher';
import { LcuConnection } from './lcu/connection';
import { LcuEventDispatcher } from './lcu/event_dispatcher';
import { LcuHelper } from './lcu_helper';
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
  /** Last known-good LCU connection, wrapped in an LcuHelper. */
  private lcu: LcuHelper | null;
  /** The URL of our WebSockets server.  */
  private readonly wsUrl: string;

  constructor(vueStore: any) {  // Should be Vuex.Store.
    this.eventDispatcher = new LcuEventDispatcher();
    this.lastState = 'lcu-offline';
    this.lcu = null;
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

  /** LCU connection wrapped in an LcuHelper.
   *
   * This throws an exception if the LCU client is not signed in.
   */
  public checkedLcu(): LcuHelper {
    if (this.lcu === null) {
      throw new Error(`LCU connection not available while ${this.lastState}`);
    }
    return this.lcu;
  }

  public enterQueue(): void {
    if (this.lastState !== 'ready') {
      return;
    }
    this.wsConnection.requestQueue();
  }

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
    console.log(`WSConnection state: ${state}`);

    if (this.loginWatcher.state() !== 'lcu-signedin') {
      return;
    }

    this.setState(state);
    if (state === 'challenged') {
      this.authenticate();  // Promise ignored intentionally.
    }
    if (state === 'matched') {
      this.setupMatch();
    }
  }

  // LoginWatcherDelegate
  public async onLoginChange(state: LoginWatcherState): Promise<void> {
    console.log(`LoginWatcher state: ${state}`);

    if (state !== 'lcu-signedin') {
      this.lcu = null;
      this.wsConnection.reset();
      this.setState(state);
      return;
    }

    // When signed in, the state comes from the WebSocket connection.
    const newState = this.wsConnection.state();
    // "as LcuConnection" is safe because loginWatcher's connection is only
    // null when the state is 'offline'.
    const lcuConnection = this.loginWatcher.connection() as LcuConnection;
    this.lcu = new LcuHelper(lcuConnection);
    this.setState(newState);
    if (newState === 'challenged') {
      this.authenticate();  // Promise intentionally ignored.
    }
  }

  private async authenticate(): Promise<void> {
    const accountId = this.loginWatcher.accountId().toString();
    const summonerId = this.loginWatcher.summonerId().toString();

    const token = this.wsConnection.token();
    await this.checkedLcu().setVerificationToken(summonerId, token as string);

    this.wsConnection.sendAuth(accountId, summonerId);
  }

  private async setupMatch(): Promise<void> {
    console.log('In setup match');
    const playerInfos = this.wsConnection.matchData();
    if (playerInfos === null || playerInfos.length === 0) {
      throw new Error('No match available');
    }

    // Only the first player is responsible for setting up the game.
    const firstPlayer = playerInfos[0];
    const ourAccountId = this.loginWatcher.accountId();
    if (firstPlayer.account_id !== ourAccountId.toString()) {
      return;
    }

    // Actually set up the match.
    const lcu = this.checkedLcu();
    await lcu.createLobby(400);  // 400 is draft, 430 is blind.

    // Invite players to the lobby.
    for (const playerInfo of playerInfos) {
      // LCU only deals with integers, so this had better be an integer.
      const accountId = parseInt(playerInfo.account_id, 10);
      if (accountId === ourAccountId) {
        continue;
      }
      const summonerId = parseInt(playerInfo.summoner_id, 10);
      await lcu.sendLobbyInvite(summonerId, playerInfo.summoner_name);
    }

    // Choose positions.
    await lcu.setLobbyPreferredRoles([playerInfos[0].role]);
  }

  /** FSM update logic. */
  private setState(state: UiControllerState): void {
    if (this.lastState === state) {
      return;
    }

    this.lastState = state;
    console.log(['UIController', state]);
    this.vueStore.commit('lcu/setStatus', state);
  }
}
