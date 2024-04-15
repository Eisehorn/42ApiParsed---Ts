import axios from "axios";
import * as dotenv from 'dotenv';
import {env} from 'process';

dotenv.config({path: './.env'});
const UID = env.UID;
const SECRET = env.SECRET;

let token: { access_token?: string } | null = null;

export async function getToken() {
	try {
		const response = await axios.post(
			'https://api.intra.42.fr/oauth/token',
			{
				grant_type: 'client_credentials',
				client_id: UID,
				client_secret: SECRET,
				scope: 'public profile projects elearning tig forum',
			}
		);
		token = response.data;
		return token
	}
	catch (error : any) {
		console.error('Error obtaining access token:', error.message);
	}
}