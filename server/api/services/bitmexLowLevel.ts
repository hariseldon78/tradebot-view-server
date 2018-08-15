import * as crypto from 'crypto';
import moment = require('moment');
import * as request from 'request-promise';

export interface Env {
	SERVER: string;
	API_KEY:string;
	API_SECRET:string;
	SYMBOL:string;
}
export enum CandleComponent {
	open, close, high, low, volume, timestamp, minutes
}

export class Candle {
	open: number;
	close: number;
	high: number;
	low: number;
	volume: number;
	timestamp: number;//seconds
	minutes: number;


	get(component: CandleComponent) {
		switch (component) {
			case CandleComponent.open:
				return this.open;
			case CandleComponent.close:
				return this.close;
			case CandleComponent.high:
				return this.high;
			case CandleComponent.low:
				return this.low;
			case CandleComponent.volume:
				return this.volume;
			case CandleComponent.timestamp:
				return this.timestamp;
			case CandleComponent.minutes:
				return this.minutes;
		}
	}

	/**
	 *
	 * @param {number} open
	 * @param {number} close
	 * @param {number} high
	 * @param {number} low
	 * @param {number} volume
	 * @param {number} timestamp seconds; start of the candle
	 * @param {number} minutes how many minutes this candle rapresent
	 */
	constructor(open: number, close: number, high: number, low: number, volume: number, timestamp: number, minutes: number) {
		this.open = open;
		this.close = close;
		this.high = high;
		this.low = low;
		this.volume = volume;
		this.timestamp = timestamp;
		this.minutes = minutes;
	}


}
export function candleFromBitmex(c) {
	// I want each candle to have the timestamp of the open moment, not the close
	return new Candle(c.open, c.close, c.high, c.low, c.volume, moment(c.timestamp).unix() - 60, 1);
}

export namespace OrderDirection {
	export enum Direction {buy, sell}

	export function invert(direction: Direction): Direction {
		switch (direction) {
			case Direction.buy:
				return Direction.sell;
			case Direction.sell:
				return Direction.buy;
		}
	}

	export function toString(direction: Direction): string {
		switch (direction) {
			case Direction.buy:
				return 'buy';
			case Direction.sell:
				return 'sell';
		}
	}

	export function toBitmexString(direction: Direction): string {
		switch (direction) {
			case Direction.buy:
				return 'Buy';
			case Direction.sell:
				return 'Sell';
		}
	}

	export function fromSign(n: number): Direction {
		if (n < 0)
			return Direction.sell;
		else
			return Direction.buy;
	}

	export function toSign(direction: Direction): number {
		switch (direction) {
			case Direction.buy:
				return 1;
			case Direction.sell:
				return -1;
		}
	}
}

export interface TradeStats{
	direction:OrderDirection.Direction;
	openPrice:number;
	stopLossDelta:number;
	openTime:string;
	closePrice:number;
	closeTime:string;
	quantity:number;
	fees:number;
	'in&Outs':number[];
	'p&l':number;
	openNotes:string;
	closeNotes:string;
}

export class BitmexApi {
	private NONCE_BASE: number=0;
	readonly env: Env;
	rateLimit: number = 100;

	constructor(env: Env) {
		this.env = env;
	}

	makeAuthRequest(url: string, method: string, body: object): Promise<any> {
		const fixed = BitmexApi.fixArgs(url, method, body);
		// console.log(`url(auth): ${fixed.url}`);
		return this.makeRequest(() => request(BitmexApi.authenticate(fixed.url, fixed.method, fixed.body, this.env, this.NONCE_BASE)));

	}

	makePublicRequest(url: string, method: string, body: object): Promise<any> {
		const fixed = BitmexApi.fixArgs(url, method, body);
		// console.log(`url(public): ${fixed.url}`);
		return this
			.makeRequest(() => request(BitmexApi.public(fixed.url, fixed.method, fixed.body, this.env)));
	}

	makeRequest(reqPromiseGenerator: () => any): Promise<any> {
		return reqPromiseGenerator()
			.then((res: Response) => {
				this.rateLimit = res.headers['x-ratelimit-remaining'];
				// console.log(`ratelimit: ${this.rateLimit}`);
				// console.log(res.body);
				if (this.rateLimit<20) {
					console.error('Bad boy, now you get punished. Wait 1 minute')
					return new Promise(resolve => setTimeout(() => resolve(res.body), 60000));
				} else
					return res.body;
			})
			.catch(err => {
				console.log(err);
				const rx = /Nonce is not increasing. This nonce: (\d+), last nonce: (\d+)/;
				let array = [];
				if (array = err.error.error.message.match(rx)) {
					const thisNonce = Number(array[1]);
					const lastNonce = Number(array[2]);
					const offset = lastNonce - thisNonce;
					this.NONCE_BASE = Number(this.NONCE_BASE) + offset;
					return reqPromiseGenerator();
				}
				console.error('Error object:', err.error.error.message);
				process.exit(200);
			});
	}

	private static fixArgs(url: string, method: string, body: any): { url: string, body: any, method:string } {
		if (method.toUpperCase() === 'GET' && url.indexOf('?') == -1)
			return {
				url: url + (body ? '?' : '') + Object.keys(body).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(body[k])}`).join('&'),
				method:method.toUpperCase(),
				body: {},
			};
		else
			return {
				url: url,
				method:method.toUpperCase(),
				body: body,
			};
	}

	private static public(url, method, body, env: Env): any {
		return {
			url: env.SERVER + url,
			method: method,
			body: body,
			json: true,
			resolveWithFullResponse: true,
		};
	}


	private static authenticate(url, method, body, env: Env, NONCE_BASE: number): any {
		const nonce = Math.floor((moment().valueOf() - moment('2018-01-01T00:00:00.000Z').valueOf()) + Number(NONCE_BASE));
		return {
			url: env.SERVER + url,
			method: method,
			headers: {
				'api-nonce': nonce,
				'api-key': env.API_KEY,
				'api-signature': this.signature(env.API_SECRET, method, url, nonce, JSON.stringify(body)),// see example here: https://github.com/BitMEX/api-connectors/blob/master/official-http/node-request/index.js
				// https://www.bitmex.com/app/apiKeysUsage#full-sample-calculation
			},
			body: body,
			json: true,
			resolveWithFullResponse: true,
		};
	}

	private static signature(apiSecret, verb, path, expires, postBody) {
		// from  https://github.com/BitMEX/api-connectors/blob/master/official-http/node-request/index.js
		return crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');
	}
}