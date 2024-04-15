import axios from "axios";
import {apiAnswer} from "./index";
import * as fs from "fs";
import * as readline from "readline";
import {parameters} from "./parseHtml";
const {Form, Input} = require('enquirer')

export let urlToCall: string = ''
export function CheckUrl(url: string): string[] {
	let returns: string[] = []
	const urlSplit = url.split('/')
	for (let i = 0; i < urlSplit.length; i++) {
		if (urlSplit[i][0] === ':') {
			returns.push(urlSplit[i].split(':')[1])
		}
	}
	return returns;
}

export function changeDots(url: string, answers: any) {
	const urlSplit = url.split('/')
	for (let i = 0; i < urlSplit.length; i++) {
		if (urlSplit[i][0] === ':') {
			urlSplit[i] = answers[`${urlSplit[i].split(':')[1]}`]
		}
		urlToCall += urlSplit[i]
		if (i + 1 != urlSplit.length){
			urlToCall += '/'
		}
	}
	return urlToCall
}

function changeUrl(url: string, answers: any) {
	for (let key in answers) {
		if (answers[key] != '' && !url.includes('?')) {
			url += `?${key}=${answers[key]}`
		}
		else if (answers[key] != '' && url.includes('?')) {
			url += `&${key}=${answers[key]}`
		}
	}
	return url
}

async function arParams(parameter: any) {
	return new Promise<any>(async resolve => {
		const prompt = new Input({
			message: `Insert all ${parameter.name} you want to use separated by a comma\n${parameter.type}`,
			initial: ''
		})
		prompt.run()
			.then((answer: any) => {
				resolve(answer.split(','))
			})
	})
}

export async function getSetup(url: string){
	let allParameters: string[] = []
	let paramToRemove: string[] = []
	let paramMessage: string[] = [];
	for (let parameter of parameters) {
		if (url.includes(parameter.name))
			paramToRemove.push(parameter.name)
		if (parameter.name != 'filter' && parameter.name != 'range') {
			allParameters.push(parameter.name)
			paramMessage.push(parameter.name.trim() + ' - ' + parameter.required.trim() + ' - ' + parameter.type.split('. ')[1].trim())
		}
		else {
			const params = await arParams(parameter)
			for (let i = 0; i < params.length; i++) {
				allParameters.push(parameter.name + '[' + params[i].trim() + ']')
				paramMessage.push(parameter.name + '[' + params[i].trim() + ']' + ' - ' + parameter.required.trim() + ' - ' + 'Must be a String')
			}
		}
	}
	const check: string[] = CheckUrl(url)
	for (let i = 0; i < check.length; i++) {
		for (let j = 0; j < allParameters.length; j++) {
			if (allParameters[j] === check[i]) {
				break
			}
			if (j + 1 === allParameters.length) {
				allParameters.push(check[i])
				paramToRemove.push(check[i])
			}
		}
	}
	if (allParameters.length > 0) {
		try {
			const prompts = allParameters.map((choice, index) => {
				if (choice != 'sort' && choice != 'range' && choice != 'filter') {
					const input = new Input({
						name: choice,
						message: paramMessage[index],
					})
					return input.options
				}
				else {
					const input = new Input({
						name: choice,
						message: choice
					})
					return input.options
				}
			})
			const prompt = new Form({
				name: 'user',
				message: 'Please provide the following information:',
				choices: prompts
			})
			let answers = await prompt.run()
			url = changeDots(url, answers)
			paramToRemove.forEach((par: string) => {
				delete answers[par]
			})
			urlToCall = changeUrl(url, answers)
		} catch (e) {
			console.error('Error', e)
		}
	}
}

function CheckNextLink(nextlink : string) : string {
	let pattern : RegExp = /<([^>]+)>; rel="next"/
	const match : RegExpExecArray | null = pattern.exec(nextlink)
	if (match) {
		return match[1]
	}
	console.log('No match found')
	return('Big error encountered')
}

function printResult(allResponses: any[]) : string {
	if (fs.existsSync('./output.json'))
		fs.writeFile('output.json', "", err => {
			if (err) {
				console.error('Error wiping the file content: ', err)
			}
		})
	allResponses.forEach(responses => {
		fs.appendFile('output.json', JSON.stringify(responses, null, 2), err => {
			if (err) {
				console.error('Error writing into file: ', err)
				return ('Failure');
			}
		})
	})
	return ('Success');
}

export async function getCall(token: any) {
	let allResponses = []
	while (true) {
		try {
			console.log('Calls are being made...', urlToCall)
			const response = await axios.get(urlToCall, {
				headers: {
					Authorization: `Bearer ${token.access_token}`,
				}
			});
			if (response.status >= 200 && response.status <= 299) {
				allResponses.push(response.data)
				try {
					const linkHeader = response.headers.link;
					const nextlink = linkHeader?.split(',').find((link: string) => link.includes('rel="next"'));
					if (nextlink != null) {
						urlToCall = CheckNextLink(nextlink);
					} else {
						break;
					}
				} catch (error) {
					console.error(error);
				}
			} else {
				console.error('Failed to fetch data. Status code:', response.status);
				break;
			}
		}
		catch (error : any) {
			console.error('Failed to fetch data. Status code:', error.message)
			return;
		}
	}
	if (printResult(allResponses) == 'Success') {
		apiAnswer('get', true);
	}
	else {
		apiAnswer('get', false)
	}
}