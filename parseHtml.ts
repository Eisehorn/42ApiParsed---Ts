import * as cheerio from "cheerio"
import * as https from "https";
import {CheerioAPI} from "cheerio";
export let finalUrl = 'https://api.intra.42.fr'
export let call: string = ''
interface Parameters {
	name: string
	type: string
	required: string
}

export let parameters: Parameters[] = []

async function resourceToAccess(calls: string[]) {
	return new Promise<string>(resolve => {
		const { Select } = require('enquirer')
		const prompt = new Select({
			name: 'Resources',
			message: 'Which resource you wanna access?',
			choices: calls
		})
		prompt.run().then((childId: any) => {
			const childSplit = childId.split(' ')
			let childToReturn: string = ''
			for (let i = 1; i < childSplit.length; i++) {
				childToReturn +=  childSplit[i]
				if (i === 1)
					childToReturn += ' '
			}
			resolve(childToReturn)
		})
	})
}

async function callAndEndpoint($: CheerioAPI) {
	return new Promise<void>(resolve => {
		const headerElement = $('[class]').filter((index: number, element) => $(element).attr('class') === 'page-header')
		const headerSplit = $(headerElement).text().trim().split('  ')
		const header = headerSplit[0].split(' ')
		call = header[0]
		resolve()
	})
}

async function parameterCreation($: CheerioAPI) {
	return new Promise<void>(resolve => {
		const parametersNames = $('strong').not('p > strong')
		const parametersRequired = $('[class]').filter((index: number, element) => $(element).attr('class') === 'label label-default' || $(element).attr('class') === 'label label-primary')
		const parametersTypes = $('tbody').find('span')
		const names: string[] = []
		const required: string[] = []
		const types: string[] = []
		parametersNames.each((index: number, element) => {
			names.push($(element).text().trim())
		})
		parametersRequired.each((index: number, element) => {
			required.push($(element).text())
		})
		parametersTypes.each((index:number, element) => {
			if ($(element).text().includes('Must be')) {
				types.push($(element).text().trim())
			}
		})
		const minLength = Math.min(names.length, required.length, types.length);
		for (let i = 0; i < minLength; i++) {
			parameters.push({
				name: names[i],
				required: required[i],
				type: types[i]
			})
		}
		resolve()
	})
}

async function finalPage(url: string) {
	return new Promise<void>( resolve => {
		https.get(url, response => {
			let data = ''
			response.on('data', chunk => {
				data += chunk
			})
			response.on('end', async () => {
				const $ = cheerio.load(data)
				const endpoint = await callAndEndpoint($)
				await parameterCreation($)
				resolve()
			})
		}).on("error", error => {
			console.error('Error:', error)
		})
	})
}

async function secondPageParse(url: string) {
	return new Promise<string>(resolve => {
		https.get(url, response => {
			let data = ''
			response.on('data', chunk => {
				data += chunk
			})
			response.on('end', () => {
				const $ = cheerio.load(data)
				const elements = $('[id]').not('#container').not('#accordion')
				const filteredIds = new Set<string>()
				let i = 0
				const calls: string[] = elements.toArray().map(element => `${i++}` + '): ' + $(element).text().trim())
				resourceToAccess(calls)
					.then(resource => {
						finalUrl += resource.split(' ')[1]
						const retrieve = $('a').filter((index: number, element) => $(element).text().trim() === resource)
						resolve(url.trim() + '/' + $(retrieve).attr('id'))
					})
			}).on("error", error => {
				console.error('Error:', error)
			})
		})
	})
}

export async function parseHtml( url: string) {
	return new Promise<void>(resolve => {
		https.get(url, (response) => {
			let data = ''
			response.on('data', chunk => {
				data += chunk
			})
			response.on('end', async () => {
				const $ = cheerio.load(data)
				const elements = $('[id]').not('#container')
				let i = 0
				const calls: string[] = elements.toArray().map(element => `${i++}` + '): ' + $(element).attr('id') || '')
				const childId = await resourceToAccess(calls)
				const finalUrl = await secondPageParse((url + '/' + childId))
				await finalPage(finalUrl)
				resolve()
			})
		}).on("error", (error) => {
			console.error(error)
		})
	})
}