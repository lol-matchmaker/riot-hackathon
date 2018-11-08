import {LcuClientWatcher} from "./lcu/client_watcher";
import {LcuEventDispatcher} from "./lcu/event_dispatcher";

/**
 * This file is SUPER WIP nothing in here is done.
 *
 */
export function SendPlayerInvites()
{
    const notificationData = [
        {
            state: "Requested",
            toSummonerId: 36813385,
            toSummonerName: "Earleking"
        },
    ];
    LCURequest('/lol-lobby/v2/eog-invitations', 'POST', notificationData)
}

export function AcceptInvites()
{
    LCURequest("/lol-lobby/v2/received-invitations/1001bd5a-e7a4-40f9-ab30-146a90b2f0ab/accept", "POST", {});
}

export function Setposition(positionOne: string, positionTwo: string)
{
    const data =
        {
            firstPreference: positionOne,
            secondPreference: positionTwo,
        };
    LCURequest('/lol-lobby/v1/lobby/members/localMember/position-preferences', "PUT", data  )
}

export function IsClientConnected()
{
   // console.log(LCURequest('/riot-messaging-service/v1/state', 'GET', {}));
}


// @ts-ignore
function LCURequest(endpoint: string, requestType: string, data )
{
    var newNotification;
    const eventDispatcher = new LcuEventDispatcher();
    const clientWatcher = new LcuClientWatcher(eventDispatcher, {
        offline: () => {
        },
        online: async connection => {
             newNotification =
                await connection.request(requestType,
                    endpoint,
                    data);
            console.log(newNotification);
        },
    });
    return newNotification;

}
