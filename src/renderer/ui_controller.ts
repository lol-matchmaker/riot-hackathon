import Vuex from 'vuex';

import { roles } from './app/lol_preferences';
import { LcuClientWatcher } from './lcu/client_watcher';
import { LcuConnection } from './lcu/connection';
import { LcuEventDispatcher } from './lcu/event_dispatcher';
import { LcuHelper } from './lcu_helper';
import { IncomingInvite, LobbyData, LoginWatcher, LoginWatcherDelegate,
         LoginWatcherState } from './login_watcher';
import { WsConnection, WsConnectionDelegate, WsConnectionState }
    from './ws_connection';
import { MatchedMessagePlayerInfo } from './ws_messages';
import { delay } from './delay';

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

  public exitQueue(): void {
    if (this.lastState !== 'queued') {
      return;
    }
    this.wsConnection.cancelQueue();
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
  public async onLobbyChange(lobby: LobbyData | null): Promise<void> {
    console.log('UIC onLobbyChange');
    console.log(lobby);

    if (this.lastState !== 'matched') {
      return;
    }
    if (lobby === null) {
      return;
    }

    // "as MatchedMessagePlayerInfo[]" is safe because the match data is not
    // null when the state is "matched".
    const playerInfos =
        this.wsConnection.matchData() as MatchedMessagePlayerInfo[];
    const summonerIds = new Set<string>();
    for (const playerInfo of playerInfos) {
      summonerIds.add(playerInfo.summoner_id);
    }

    // Select our roles if we still need to.
    const ourSummonerId = this.loginWatcher.summonerId();
    const ourMember =
        lobby.members.find(member => member.summoner_id === ourSummonerId);
    if (ourMember !== undefined) {
      const hasUnselectedRole =
          ourMember.roles.find(role => role === 'UNSELECTED') !== undefined;
      if (hasUnselectedRole) {
        const ourSummonerIdString = ourSummonerId.toString();
        const ourPlayerInfo = playerInfos.find(
            playerInfo => playerInfo.summoner_id === ourSummonerIdString);
        if (ourPlayerInfo !== undefined) {
          console.log('Selecting our roles');
          for (let retryCount = 0; retryCount < 100; ++retryCount) {
            await delay(1000);
            try {
              await this.checkedLcu().setLobbyPreferredRoles(
                  [ourPlayerInfo.role]);
              break;
            } catch (lcuError) {
              console.error('LCU error while inviting');
              console.error(lcuError);
            }
          }
        }
      }
    }

    // The first player starts the game after everyone selected roles.
    const firstPlayer = playerInfos[0];
    const ourAccountId = this.loginWatcher.accountId();
    if (firstPlayer.account_id !== ourAccountId.toString()) {
      return;
    }

    // Check if all needed players have selected roles.
    for (const member of lobby.members) {
      const summonerId = member.summoner_id.toString();
      if (!summonerIds.has(summonerId)) {
        continue;
      }

      const hasUnselectedRole =
          member.roles.find(role => role === 'UNSELECTED') !== undefined;
      if (hasUnselectedRole) {
        return;
      }
    }

    // Check if all needed players have accepted invitations.
    for (const invite of lobby.invites) {
      if (invite.state !== 'Accepted') {
        // TODO(pwnall): Bail and reset if the invite state is Declined.
        continue;
      }
      const summonerId = invite.summoner_id.toString();
      summonerIds.delete(summonerId);
    }
    if (summonerIds.size === 0) {
      this.checkedLcu().startLobbyMatch();
    }
  }
  public async onIncomingInvitesChange(invites: IncomingInvite[]):
      Promise<void> {
    console.log('UIC onIncomingInvitesChange');
    console.log(invites);
    if (this.lastState !== 'matched') {
      return;
    }
    await this.acceptMatchInviteIfPending();
  }

  private async authenticate(): Promise<void> {
    const accountId = this.loginWatcher.accountId().toString();
    const summonerId = this.loginWatcher.summonerId().toString();

    const token = this.wsConnection.token();
    await this.checkedLcu().setVerificationToken(summonerId, token as string);

    this.wsConnection.sendAuth(accountId, summonerId);
  }

  private async acceptMatchInviteIfPending(): Promise<void> {
    // "as MatchedMessagePlayerInfo[]" is safe because the match data is not
    // null when the state is "matched".
    const playerInfos =
        this.wsConnection.matchData() as MatchedMessagePlayerInfo[];
    const firstPlayer = playerInfos[0];
    // LCU only deals with integer IDs.
    const firstPlayerSummonerId = parseInt(firstPlayer.summoner_id, 10);

    for (const invite of this.loginWatcher.invites()) {
      if (invite.summoner_id !== firstPlayerSummonerId ||
          invite.state === 'Accepted') {
        continue;
      }

      await this.checkedLcu().acceptLobbyInvite(invite.invitation_id);
      return;
    }
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
      await this.acceptMatchInviteIfPending();
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
