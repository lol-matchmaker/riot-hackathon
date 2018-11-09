import {LcuConnection} from "./lcu/connection";


// @ts-ignore
export function SendAllInvites(playerdatalist, connection: LcuConnection) {
    for (let playerdata of playerdatalist )
    {
        var id = playerdata["toSummonerId"];
        SendPlayerInvite(id, connection);
    }
}

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

export function AcceptInvites(fromSummonerID: string, invitationID: string, connection: LcuConnection, )
{
    LCURequest("/lol-lobby/v2/received-invitations/" + invitationID + "/accept", "POST", {}, connection);
}



export function Setposition(positionOne: string, positionTwo: string, connection: LcuConnection)
{
    const data =
        {
            firstPreference: positionOne,
            secondPreference: positionTwo,
        };
    LCURequest('/lol-lobby/v1/lobby/members/localMember/position-preferences', "PUT", data, connection  )
}


 export async function GetInvitationID(connection: LcuConnection, summonerID: string)
{

    var json = await LCURequest('/lol-lobby/v2/received-invitations', 'GET', {}, connection);
    if(+summonerID == +json["fromSummonerId"])
    {
        return json["invitationId"]
    }

}


export function CreateLobby(queID: number, connection: LcuConnection)
{
    //430 is blind
    var data =
        {
            "gameCustomization": {},
            "isCustom": false,
            "queueId": queID
        };
    LCURequest('/lol-lobby/v2/lobby', 'POST', data, connection);
}

// @ts-ignore
async function LCURequest(endpoint: string, requestType: string, data, connection: LcuConnection) {

    var returndata = await connection.request(requestType, endpoint, data);
    console.log(returndata);
    return returndata;


}
