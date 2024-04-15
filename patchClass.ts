import axios from "axios";
import {apiAnswer} from "./index";
import {Body, urlToCallPost} from "./postCalls";

export async function patchCall(token: any, body: Body) {
	if (!token || !token.access_token) {
		console.error('Access token is missing or invalid.');
		return;
	}
	console.log(urlToCallPost)
	console.log(body)
	try {
		const response = await axios.patch(
			urlToCallPost,
			body,
			{
				headers: {
					Authorization: `Bearer ${token.access_token}`,
					'Content-Type': 'application/json',
				},
			}
		);
		if (response.status >= 200 && response.status <= 299)
			apiAnswer('patch', true)
		else
			apiAnswer('patch', false)
	} catch (error : any) {
		console.error('Error posting data:', error.message);
	}
}