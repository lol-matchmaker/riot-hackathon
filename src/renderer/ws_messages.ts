/** Server -> Client: Not authenticated. */
export interface ChallengeMessage {
  type: 'challenge';
  /** Challenge token to be set as the summoner's verification string. */
  token: string;
}

/** Client -> Server: Ready to be authenticated. */
export interface AuthMessage {
  type: 'auth';
  accountId: string;
  summonerId: string;
}

/** Server -> Client: Authenticated. Make requests. */
export interface WelcomeMessage {
  type: 'ready';
}

/** All messages. */
export type WsMessage =
    ChallengeMessage | AuthMessage | WelcomeMessage;
