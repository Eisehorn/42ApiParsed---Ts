import {getToken} from "./tokenCreation";
import {getSetup, getCall, urlToCall} from "./getCalls";

import {call, finalUrl, parameters, parseHtml} from "./parseHtml";
import {deleteCall} from "./deleteCalls";
import {Body, finalSetup, postCall, postSetup} from "./postCalls";
import {putCall} from "./putClass";
import {patchCall} from "./patchClass";
export function apiAnswer(callType: string, success: boolean) {
    if (success) {
        console.log(`${callType.toUpperCase()} call ended successfully.`)
    }
    else {
        console.log(`There was a problem with your ${callType} call.`)
    }
}

async function main() {
    let token = await getToken();
    await parseHtml('https://api.intra.42.fr/apidoc/2.0')
    switch (call.toLowerCase().trim()) {
        case 'get':
            await getSetup(finalUrl)
            await getCall(token)
            break

        case 'post':
            const body: Body = await postSetup(finalUrl)
            const bodyFinal = await finalSetup(body)
            await postCall(token, bodyFinal);
            break

        case 'patch':
            const bodyPatch: Body = await postSetup(finalUrl)
            const bodyFinalPatch = await finalSetup(bodyPatch)
            await patchCall(token, bodyFinalPatch)
            break

        case 'put':
            const bodyPut: Body = await postSetup(finalUrl)
            const bodyFinalPut = await finalSetup(bodyPut)
            await putCall(token, bodyFinalPut)
            break

        case 'delete':
            await getSetup(finalUrl)
            await deleteCall(token)
            break
    }
}

main();
