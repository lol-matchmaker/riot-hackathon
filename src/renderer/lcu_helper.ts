import { LcuConnection } from './lcu/connection';
import { MatchedMessagePlayerRole } from './ws_messages';

/** Wraps an LcuConnection and implements high-level methods on top of it. */
export class LcuHelper {
  private readonly connection: LcuConnection;

  constructor(lcuConnection: LcuConnection) {
    this.connection = lcuConnection;
  }

  /** Used to authenticate the ownership of a League account to our server. */
  public async setVerificationToken(summonerId: string, token: string):
    Promise<void> {
    const url = `/lol-collections/v1/inventories/${summonerId}/verification`;
    await this.connection.request('PUT', url, token);
  }

  /** Creates a notification in the League clinet (LCU). */
  public async postNotification(expiresInMs: (number | null) = null):
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
    const newNotification = await this.connection.request(
        'POST', '/player-notifications/v1/notifications', notificationData);
    const notificationId: number = newNotification.id;
    return notificationId;
  }

  /** Create a game lobby. */
  public async createLobby(queueId: number): Promise<void> {
    const lobbySkeleton = {
      gameCustomization: {},
      isCustom: false,
      queueId,
    };
    const lobbyData = await this.connection.request(
        'POST', '/lol-lobby/v2/lobby', lobbySkeleton);
    console.log(lobbyData);
  }

  /** Invite a player to a lobby. */
  public async sendLobbyInvite(summonerId: number,
                               summonerName: string): Promise<void> {
    const invitation = await this.connection.request(
        'POST', '/lol-lobby/v2/eog-invitations',
        { state: 'Requested', toSummonerId: summonerId,
          toSummonerName: summonerName });
    console.log(invitation);
  }

  /** Set a position in a game lobby. */
  public async setLobbyPreferredRoles(roles: MatchedMessagePlayerRole[]):
      Promise<void> {
    await this.connection.request(
        'PUT', '/lol-lobby/v1/lobby/members/localMember/position-preferences',
        { firstPreference: roles[0] || 'FILL',
          secondPreference: roles[1] || 'FILL'});
  }

}
