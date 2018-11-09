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

/** Client -> Server: Player is ready to get matched. Do magic. */
export interface RequestQueueMessage {
  type: 'plsqueue';
}

/** Server -> Client: Player is in queue. Ask player to wait. */
export interface QueuedMessage {
  type: 'queued';
}

/** Client -> Server: Player is ready to get matched. Do magic. */
export interface CancelQueueMessage {
  type: 'noqueue';
}

/** Server -> Client: Player is no longer in the queue for some reason. */
export interface DequeuedMessage {
  type: 'dequeued';
}

/** Server -> Client: Player is in match. */
export interface MatchedMessage {
  type: 'matched';
}

/** All messages. */
export type WsMessage =
    ChallengeMessage | AuthMessage | WelcomeMessage | RequestQueueMessage |
    QueuedMessage | CancelQueueMessage | DequeuedMessage | MatchedMessage;
