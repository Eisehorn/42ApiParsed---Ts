import axios from "axios";
import {apiAnswer} from "./index";
import {urlToCall} from "./getCalls";

export async function deleteCall(token : any) {
	if (!token || !token.access_token) {
		console.error('Access token is missing or invalid.');
		return;
	}
	try {
		const response = await axios.delete(
			urlToCall,
			{
				headers: {
					Authorization: `Bearer ${token.access_token}`,
					'Content-Type': 'application/json',
				},
			}
		);
		if (response.status >= 200 && response.status <= 299)
			apiAnswer('delete', true)
		else
			apiAnswer('delete', false)
	} catch (error : any) {
		console.error('Error posting data:', error.message);
	}
}