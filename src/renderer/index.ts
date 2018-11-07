// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import { LcuClientWatcher } from './lcu/client_watcher';
import { LcuEventDispatcher } from './lcu/event_dispatcher';

const eventDispatcher = new LcuEventDispatcher();
eventDispatcher.addListener('OnJsonApiEvent', {
  onLcuEvent: (_: string, payload: any) => {
    console.log(payload);
  },
});

const clientWatcher = new LcuClientWatcher(eventDispatcher, {
  offline: () => { return; },
  online: async connection => {
    const queues =
        await connection.request('GET', '/lol-game-queues/v1/queues');
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
  },
});
