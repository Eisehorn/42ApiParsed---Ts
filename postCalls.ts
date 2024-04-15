import axios from "axios";
import {apiAnswer} from "./index";
import { parameters} from "./parseHtml";
import {prompt} from "enquirer";
import {changeDots, CheckUrl} from "./getCalls";
const {Input, Form} = require('enquirer')
export let urlToCallPost: string

export interface Body {
	[key:string]:any
}

export async function postSetup(url: string) {
	return new Promise<object>(async resolve => {
		let elFlag = false
		let outer: Body = {}
		let inner: Body = {}
		let mostInner: Body = {}
		let elKey: string = '';
		const check: string[] = CheckUrl(url)
		if (check.length != 0) {
			const prompts = check.map((choice: string, index: number) => {
				const input = new Input({
					name: choice,
					message: `Insert value of ${choice}`
				})
				return input.options
			})
			const prompt = new Form({
				name: 'user',
				message: 'Please provide the following information:',
				choices: prompts
			})
			let answers = await prompt.run()
			url = changeDots(url, answers)
		}
		urlToCallPost = url
		for (let i = 0; i < parameters.length; i++) {
			if (parameters[i].type.includes('Hash')) {
				elFlag = true
			}
		}
		if (elFlag == true) {
			let k = 0
			while (!parameters[k].type.includes('Hash'))
				k++
			parameters.splice(0, k)
		}
		else {
			check.forEach(choice => {
				for (let j = 0; j < parameters.length; j++) {
					if (choice === parameters[j].name) {
						parameters.splice(j, 1)
						break
					}
				}
			})
		}
		for (let i = 0; i < parameters.length; i++) {
			//console.log(parameters[i])
			if (parameters[i].type.includes('Hash')) {
				elKey = parameters[i].name
				elFlag = true
			} else {
				if (parameters[i].type.includes('Array of nested elements')) {
					let j = i + 1
					for (j; j < parameters.length; j++) {
						if (parameters[j].name.includes(parameters[i].name)) {
							if (parameters[j].type.includes('array of')) {
								mostInner[parameters[j].name.replace(parameters[i].name, '').replace(/\[|\]/g, '')] = []
							}
							else {
								mostInner[parameters[j].name.replace(parameters[i].name, '').replace(/\[|\]/g, '')] = ''
							}
						} else {
							break
						}
					}
					inner[parameters[i].name.replace(elKey, '').replace(/\[|\]/g, '')] = mostInner
					mostInner = {}
					i = j - 1
				}
				else if (parameters[i].type.includes('array of')) {
					inner[parameters[i].name.replace(elKey, '').replace(/\[|\]/g, '')] = []
				}
				else {
					inner[parameters[i].name.replace(elKey, '').replace(/\[|\]/g, '')] = ''
				}
			}
		}
		outer[elKey] = inner
		if (elFlag) {
			resolve(outer)
		}
		else {
			resolve(inner)
		}
	})
}

export async function finalSetup(body: Body) {
	return new Promise<Body>(async resolve => {
		let i = 0
		for (const key in body) {
			if (typeof body[key] === 'object') {
				i++
				for (const subKey in body[key]) {
					if (typeof body[key][subKey] === 'object') {
						i++
						for (const innerKey in body[key][subKey]) {
							const value: Body = await prompt({
								type: 'input',
								name: subKey + '-' + innerKey,
								message: `Enter value for ${subKey}-${innerKey} (${parameters[i].required}):\n${parameters[i].type}`
							});
							if (value[`${subKey}-${innerKey}`] != '') {
								body[key][subKey][innerKey] = value[`${subKey}-${innerKey}`]
							}
							else {
								delete body[key][subKey][innerKey]
							}
							i++
						}
					}
					else {
						const value: Body = await prompt({
							type: 'input',
							name: subKey,
							message: `Enter value for ${subKey}: (${parameters[i].required}):\n${parameters[i].type}`
						});
						if (value[subKey] != '') {
							body[key][subKey] = value[subKey]
						}
						else {
							delete body[key][subKey]
						}
						i++
					}
				}
			} else {
				const value: Body = await prompt({
					type: 'input',
					name: key,
					message: `Enter value for ${key}: (${parameters[i].required}):\n${parameters[i].type}`
				});
				if (value[key] != '') {
					body[key] = value[key]
				}
				else {
					delete body[key]
				}
				i++
			}
		}
		resolve(body)
	})
}

export async function postCall(token: any, body: Body) {
	if (!token || !token.access_token) {
		console.error('Access token is missing or invalid.');
		return;
	}
	try {
		const response = await axios.post(
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
			apiAnswer('post', true)
		else
			apiAnswer('post', false)
	} catch (error : any) {
		console.error('Error posting data:', error.message);
	}
}