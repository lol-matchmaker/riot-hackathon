import {LcuClientWatcher} from "./lcu/client_watcher";
import {LcuEventDispatcher} from "./lcu/event_dispatcher";
const request = require('request');
const path = require('path');
const ApiKey = "RGAPI-3ef0766a-2754-4a23-82c5-868572d39e06";

/**
 * This file is SUPER WIP nothing in here is done.
 *
 */
// @ts-ignore

export function SendAllInvites(playerdatalist) {
    for (let playerdata of playerdatalist )
    {
        var id = playerdata["toSummonerId"];
        SendPlayerInvite(id);
    }
}

export function SendPlayerInvite(summonerid: number)
{
    const notificationData = [
        {
            state: "Requested",
            toSummonerId: summonerid,
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



export function GetInvitationID()
{
    var json = LCURequest('/lol-lobby/v2/received-invitations', 'GET', {});
    var invitations = JSON.parse(json);
    var invitationID = invitations["invitationId"];
}


export function CreateLobby()
{
    var data =
        {
            "gameCustomization": {},
            "isCustom": false,
            "queueId": 430
        };
    LCURequest('/lol-lobby/v2/lobby', 'POST', data);
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
