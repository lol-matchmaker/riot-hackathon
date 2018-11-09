import { LcuConnection } from './lcu/connection';
import { LcuEventDispatcher } from './lcu/event_dispatcher';
import { MatchedMessagePlayerRole } from './ws_messages';

export type LoginWatcherState = 'lcu-offline' | 'lcu-online' | 'lcu-signedin';

export interface LobbyInvite {
  state: 'Accepted' | 'Declined' | 'Pending' | 'Requested';
  summoner_id: number;
  summoner_name: string;
}

export interface LobbyMember {
  roles: Array<MatchedMessagePlayerRole | 'UNSELECTED'>;
  summoner_id: number;
  summoner_name: string;
}

export interface LobbyData {
  invites: LobbyInvite[];
  members: LobbyMember[];
  queue_id: number;
}

export interface IncomingInvite {
  invitation_id: string;
  state: 'Accepted' | 'Declined' | 'Pending' | 'Requested';
  summoner_id: number;
  summoner_name: string;
  queue_id: number;
}

export interface LoginWatcherDelegate {
  onLoginChange(state: LoginWatcherState): void;
  onLobbyChange(lobby: LobbyData | null): void;
  onIncomingInvitesChange(invites: IncomingInvite[]): void;
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
  /** Last reported incomig invitations. */
  private lastInvites: IncomingInvite[];
  /** Last reported lobby update. */
  private lastLobby: LobbyData | null;
  /** True if an online connection exists. */
  private isConnected: boolean;
  /** The most recent state reported to the delegate. */
  private lastState: LoginWatcherState | null;

  constructor(eventDispatcher: LcuEventDispatcher,
              delegate: LoginWatcherDelegate) {
    this.delegate = delegate;
    this.lastAccountId = 0;
    this.lastConnection = null;
    this.lastInvites = [];
    this.lastLobby = null;
    this.lastSummonerId = 0;
    this.isConnected = false;
    this.lastState = null;

    eventDispatcher.addListener(
        'OnJsonApiEvent_lol-login_v1_session',
        this.onLoginSessionChange.bind(this));
    eventDispatcher.addListener(
        'OnJsonApiEvent_lol-lobby_v2_lobby',
        this.onLobbyChange.bind(this));
    eventDispatcher.addListener(
        'OnJsonApiEvent_lol-lobby_v2_received-invitations',
        this.onInvitationsChange.bind(this));
    eventDispatcher.addListener(
        '@-lcu-online', this.onConnectionOnline.bind(this));
    eventDispatcher.addListener(
        '@-lcu-offline', this.onConnectionOffline.bind(this));
  }

  public accountId(): number { return this.lastAccountId; }
  public connection(): LcuConnection | null { return this.lastConnection; }
  public invites(): IncomingInvite[] { return this.lastInvites; }
  public lobby(): LobbyData | null { return this.lastLobby; }
  public state(): LoginWatcherState | null { return this.lastState; }
  public summonerId(): number { return this.lastSummonerId; }

  private onConnectionOnline(_topic: string, payload: any): void {
    const connection = payload.connection as LcuConnection;
    this.isConnected = true;
    this.lastConnection = connection;
    this.updateLoginSessionFrom(connection);  // Promise intentionally ignored.
  }

  private onConnectionOffline(_topic: string, _payload: LcuConnection): void {
    this.isConnected = false;
    this.lastConnection = null;
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
      this.updateLoginSession(null);
      return;
    }
    this.updateLoginSession(loginSession);
  }

  private onLoginSessionChange(topic: string, payload: any): void {
    if (topic !== 'OnJsonApiEvent_lol-login_v1_session') {
      return;
    }
    const loginSession = payload.data;
    this.updateLoginSession(loginSession);
  }

  private updateLoginSession(loginSession: any): void {
    if (typeof loginSession !== 'object' || loginSession === null) {
      this.resetLoginSession();
      return;
    }
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
    this.setState('lcu-signedin');

    // "as LcuConnection" is safe because we're guaranteed to have a connection
    // while signed in.
    const connection = this.lastConnection as LcuConnection;
    this.updateLobbyFrom(connection);  // Promise intentionally ignored.
    this.updateInvitationsFrom(connection);  // Promise intentionally ignored.
  }

  private resetLoginSession(): void {
    this.lastAccountId = 0;
    this.lastSummonerId = 0;
    this.setState(this.isConnected ? 'lcu-online' : 'lcu-offline');
    this.setInvites([]);
    this.setLobby(null);
  }

  private async updateLobbyFrom(connection: LcuConnection): Promise<void> {
    let lcuLobby: any;
    try {
      lcuLobby = await connection.request('GET', '/lol-lobby/v2/lobby');
    } catch (readError) {
      // Read failures means the lobby is missing.
      this.updateLobby(null);
      return;
    }
    this.updateLobby(lcuLobby);
  }

  private onLobbyChange(topic: string, payload: any): void {
    if (topic !== 'OnJsonApiEvent_lol-lobby_v2_lobby') {
      return;
    }
    const lcuLobby = payload.data;
    if (lcuLobby !== null && typeof lcuLobby !== 'object') {
      return;
    }
    this.updateLobby(lcuLobby);
  }

  private updateLobby(lcuLobby: any): void {
    if (lcuLobby === null) {
      this.setLobby(null);
      return;
    }

    const gameConfig = lcuLobby.gameConfig;
    if (typeof gameConfig !== 'object' ||
        typeof gameConfig.queueId !== 'number') {
      return;
    }
    const lobby: LobbyData = {
      invites: [],
      members: [],
      queue_id: gameConfig.queueId,
    };

    for (const invitation of lcuLobby.invitations) {
      if (typeof invitation !== 'object' ||
          typeof invitation.toSummonerId !== 'number' ||
          typeof invitation.toSummonerName !== 'string' ||
          typeof invitation.state !== 'string') {
        return;
      }
      lobby.invites.push({
        state: invitation.state,
        summoner_id: invitation.toSummonerId,
        summoner_name: invitation.toSummonerName,
      });
    }
    if (lobby.invites.length === 0) {
      return;
    }

    for (const member of lcuLobby.members) {
      if (typeof member !== 'object' ||
          typeof member.summonerId !== 'number' ||
          typeof member.summonerName !== 'string' ||
          typeof member.firstPositionPreference !== 'string' ||
          typeof member.secondPositionPreference !== 'string') {
        return;
      }
      lobby.members.push({
        roles: [member.firstPositionPreference,
                member.secondPositionPreference],
        summoner_id: member.summonerId,
        summoner_name: member.summonerName,
      });
    }
    if (lobby.members.length === 0) {
      return;
    }

    this.setLobby(lobby);
  }

  private async updateInvitationsFrom(connection: LcuConnection):
      Promise<void> {
    let lcuInvitations: any;
    try {
      lcuInvitations = await connection.request(
          'GET', '/lol-lobby/v2/received-invitations');
    } catch (readError) {
      // Read failures means no invitations.
      this.updateInvitations([]);
      return;
    }
    this.updateInvitations(lcuInvitations);
  }

  private onInvitationsChange(topic: string, payload: any): void {
    console.log('OnInvitationsChange');
    console.log(topic);
    // if (topic !== 'OnJsonApiEvent_lol-lobby_v2_received-invitations') {
    //   return;
    // }
    const lcuInvitations = payload.data;
    if (typeof lcuInvitations !== 'object') {
      return;
    }
    this.updateInvitations(lcuInvitations);
  }

  private updateInvitations(lcuInvitations: any): void {
    console.log('UpdateInvitations');
    console.log(lcuInvitations);

    const invites = [];
    for (const lcuInvitation of lcuInvitations) {
      if (typeof lcuInvitation !== 'object' ||
          typeof lcuInvitation.invitationId !== 'string' ||
          typeof lcuInvitation.fromSummonerId !== 'number' ||
          typeof lcuInvitation.fromSummonerName !== 'string' ||
          typeof lcuInvitation.state !== 'string') {
        return;
      }

      const gameConfig = lcuInvitation.gameConfig;
      if (typeof gameConfig !== 'object' ||
          typeof gameConfig.queueId !== 'number') {
        return;
      }
      invites.push({
        invitation_id: lcuInvitation.invitationId,
        queue_id: gameConfig.queueId,
        state: lcuInvitation.state,
        summoner_id: lcuInvitation.fromSummonerId,
        summoner_name: lcuInvitation.fromSummonerName,
      });
    }
    this.setInvites(invites);
  }

  private setInvites(invites: IncomingInvite[]): void {
    if ((this.lastInvites.length === 0) === (invites.length === 0)) {
      return;
    }
    this.lastInvites = invites;
    this.delegate.onIncomingInvitesChange(invites);
  }

  private setLobby(lobby: LobbyData | null): void {
    if (this.lastLobby === lobby) {
      return;
    }
    this.lastLobby = lobby;
    this.delegate.onLobbyChange(lobby);
  }

  private setState(state: LoginWatcherState): void {
    if (this.lastState === state) {
      return;
    }
    this.lastState = state;
    this.delegate.onLoginChange(state);
  }
}
