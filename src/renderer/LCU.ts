import {LcuConnection} from "./lcu/connection";

/**Used to setup the lobbt and select roles for leader **/
// @ts-ignore
export function SetupParty(queueid: number, playerdatalist, connection: LcuConnection, roles: string[])
{
    CreateLobby(queueid, connection);
    SendAllInvites(playerdatalist, connection);
    Setposition(roles[0], roles[1], connection);
}

/**Send all invites to the player given an dict of player summoner ids **/
// @ts-ignore
export function SendAllInvites(playerdatalist, connection: LcuConnection) {
    for (let playerdata of playerdatalist )
    {
        var id = playerdata["toSummonerId"];
        SendPlayerInvite(id, connection);
    }
}

/**Send an individual invite to a player via summoner id **/
export function SendPlayerInvite(summonerid: number, connection: LcuConnection)
{
    const notificationData = [
        {
            state: "Requested",
            toSummonerId: summonerid,
        },
    ];
    LCURequest('/lol-lobby/v2/eog-invitations', 'POST', notificationData, connection)
}

export function StartQueue(connections: LcuConnection)
{
    LCURequest('/lol-lobby/v2/lobby/matchmaking/search', 'POST', {}, connections);
}
/**Accepts any open invites **/
export function AcceptInvites(fromSummonerID: string, invitationID: string, connection: LcuConnection, )
{
    LCURequest("/lol-lobby/v2/received-invitations/" + invitationID + "/accept", "POST", {}, connection);
}


/** Sets players primary and secondary positions when in lobby **/
export function Setposition(positionOne: string, positionTwo: string, connection: LcuConnection)
{
    const data =
        {
            firstPreference: positionOne,
            secondPreference: positionTwo,
        };
    LCURequest('/lol-lobby/v1/lobby/members/localMember/position-preferences', "PUT", data, connection  )
}

/** Retrieves the invitation id from open invites **/
export async function GetInvitationID(connection: LcuConnection, summonerID: string)
{

    var json = await LCURequest('/lol-lobby/v2/received-invitations', 'GET', {}, connection);
    if(+summonerID == +json["fromSummonerId"])
    {
        return json["invitationId"]
    }
}

/** sends notifications to client **/
export function sendNotification(notif: string, connection: LcuConnection)
{
    const data=
        {
            "msgBody": [notif],
            "msgType": "string"
        };
    LCURequest('/lol-simple-dialog-messages/v1/messages', 'POST', data, connection);
}

/** Creates a game lobby of given game type**/
export function CreateLobby(queueID: number, connection: LcuConnection)
{
    //430 is blind
    var data =
        {
            "gameCustomization": {},
            "isCustom": false,
            "queueId": queueID
        };
    LCURequest('/lol-lobby/v2/lobby', 'POST', data, connection);
}


/** Executes a LCU request given a connection **/
// @ts-ignore
async function LCURequest(endpoint: string, requestType: string, data, connection: LcuConnection) {

    var returndata = await connection.request(requestType, endpoint, data);
    console.log(returndata);
    return returndata;
}
