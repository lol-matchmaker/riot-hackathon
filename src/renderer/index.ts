// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import Vue from 'vue';

import App from './app/App.vue';
import { store } from './app/store';

import { LcuClientWatcher } from './lcu/client_watcher';
import { LcuConnection } from './lcu/connection';
import { LcuEventDispatcher } from './lcu/event_dispatcher';
import { LoginWatcher } from './login_watcher';
import { WsConnection } from './ws_connection';

// tslint:disable-next-line:no-unused-expression
new Vue({
  el: '#app',
  render: h => h(App),
});

const eventDispatcher = new LcuEventDispatcher();
eventDispatcher.addListener('OnJsonApiEvent',  (_: string, payload: any) => {
  console.log(payload);
});
eventDispatcher.addListener('OnLcdsEvent', (_: string, payload: any) =>  {
  console.log(payload);
});
// Also available:
// OnLog, OnRegionLocaleChanged,
// OnServiceProxyAsyncEvent, OnServiceProxyMethodEvent, OnServiceProxyUuidEvent

// TODO(pwnall): Dev/Prod URL?
const wsUrl = 'http://127.0.0.1:3000';
const wsConnection = new WsConnection(wsUrl, {
  onChallenge(): void {
    authenticateIfPossible();  // Promise intentionally ignored.
  },
  onReady(): void {
    console.log('WS Ready');
  },
});

const loginWatcher = new LoginWatcher(eventDispatcher, {
  async onLoginChange(state: 'offline' | 'online' | 'signedin'):
      Promise<void> {
    console.log(`LoginWatcher state: ${state}`);
    store.commit('lcu/setStatus', state);

    switch (state) {
      case 'offline':
      case 'online':
        return;
      case 'signedin':
        break;
      default:
        return;
    }
    if (state !== 'signedin') {
      return;
    }

    authenticateIfPossible();  // Promise intentionally ignored.

    /*
    // "as LcuConnection" is safe because the connection is only null when the
    // state is "offline".
    const connection = loginWatcher.connection() as LcuConnection;
    const queues = await connection.request('GET',
                                            '/lol-game-queues/v1/queues');
    console.log(queues);

    const notificationData = {
      backgroundUrl: '',
      created: (new Date()).toISOString(),
      critical: true,
      data: { mission_title: 'Figure Out LCU' },
      detailKey: 'new_mission_details',
      dismissible: true,
      expires: '',
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
    const notificationId = newNotification.id;
    console.log(notificationId);
    */
  },
});

async function setVerificationToken(
    connection: LcuConnection, summonerId: string,  token: string):
    Promise<void> {
  const url = `/lol-collections/v1/inventories/${summonerId}/verification`;
  await connection.request('PUT', url, token);
}

async function authenticateIfPossible(): Promise<void> {
  if (loginWatcher.state() !== 'signedin') {
    return;
  }
  const accountId = loginWatcher.accountId().toString();
  const summonerId = loginWatcher.summonerId().toString();

  const token = wsConnection.token();
  if (wsConnection.isAuthenticated() === true || token === null) {
    return;
  }

  // "as LCUConnection" is safe because connection() can only return null when
  // the state is 'offline' or null.
  const lcuConnection = loginWatcher.connection() as LcuConnection;
  await setVerificationToken(lcuConnection, summonerId, token);

  wsConnection.sendAuth(accountId, summonerId);
}


// tslint:disable-next-line:no-unused-expression
new LcuClientWatcher(eventDispatcher);
