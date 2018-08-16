import moment = require('moment');
import {last, StopWatch} from './utils';
import {BitmexApi, Candle, candleFromBitmex, Env, OrderDirection, TradeStats} from './bitmexLowLevel';
// @ts-ignore
const api = new BitmexApi(process.env as Env);

export interface BitmexOrder {
	orderID: string;
	clOrdID: string;
	clOrdLinkID: string;
	account: number;
	symbol: string;
	side: string;
	simpleOrderQty: number;
	orderQty: number;
	price: number;
	displayQty: number;
	stopPx: number;
	pegOffsetValue: number;
	pegPriceType: string;
	currency: string;
	settlCurrency: string;
	ordType: string;
	timeInForce: string;
	execInst: string;
	contingencyType: string;
	exDestination: string;
	ordStatus: string;
	triggered: string;
	workingIndicator: boolean;
	ordRejReason: string;
	simpleLeavesQty: number;
	leavesQty: number;
	simpleCumQty: number;
	cumQty: number;
	avgPx: number;
	multiLegReportingType: string;
	text: string;
	transactTime: string;
	timestamp: string;
}

class Trade implements TradeStats {
	openPrice: number;
	openTime: string;
	openNotes: string;
	direction: OrderDirection.Direction;
	quantity: number;
	stopLossDelta: number;

	constructor(open: BitmexOrder, stop: BitmexOrder, close: BitmexOrder | null = null) {
		console.log('constructing trade:');
		[open,stop,close].forEach(o=>console.log(o));
		this.openPrice = open.price;
		this.openTime = open.timestamp;
		this.openNotes = open.text;
		this.direction = OrderDirection.fromString(open.side);
		this.fees = open.simpleCumQty*0.00075;
		this.quantity = open.simpleCumQty;
		this.stopLossDelta = Math.abs(stop.stopPx - open.price);
		if (close) {
			this.closePrice = close.price;
			this.closeTime = close.timestamp;
			this.closeNotes = close.text;
			this.fees += close.simpleCumQty*0.00075;
		} else {
			this.closePrice = stop.price;
			this.closeTime = stop.timestamp;
			this.closeNotes = stop.text;
			this.fees += stop.simpleCumQty*0.00075;
		}
		this['in&Outs'].push(OrderDirection.toSign(OrderDirection.invert(this.direction))*this.quantity*this.openPrice);
		this['in&Outs'].push(-1*this.fees);
		this['in&Outs'].push(OrderDirection.toSign(this.direction)*this.quantity*this.closePrice);
		this['p&l']=this['in&Outs'].reduce((a,e)=>a+e);
	}

	'in&Outs': number[]=[];
	'p&l': number;
	closeNotes: string;
	closePrice: number;
	closeTime: string;
	fees: number;
}

export async function bitmexTrades(env: Env): Promise<TradeStats[]> {
	const to = moment().toISOString();
	let from = moment(to).subtract(10, 'days').toISOString();
	const allOrders: BitmexOrder[] = await api.makeAuthRequest(
		'/api/v1/order',
		'get',
		{
			symbol: env.SYMBOL,
			count: 500,
			startTime: from,
			endTime: to,
		});
	// console.log(allOrders);
	let matchedOrders: string[] = [];

	function isOpen(order: BitmexOrder) {
		return order.ordType == 'Market' && order.ordStatus == 'Filled';
	}

	function isStopLoss(order: BitmexOrder) {
		return order.ordType == 'Stop';
	}

	function isClose(order: BitmexOrder) {
		return order.ordType == 'MarketWithLeftOverAsLimit' && order.ordStatus == 'Filled';
	}

	const firstOpenIndex = allOrders.findIndex(isOpen);
	let state = 0;// 0: waiting open 1: waiting stop-filled or close-filled 2:waiting stop-canceled
	let openOrder = null;
	let stopLoss = null;
	let closeOrder = null;
	let trades = [];
	for (let i = firstOpenIndex; i < allOrders.length; i++) {
		const order = allOrders[i];
		console.log(`Order n° ${i} state:${state} ${order.ordType}, ${order.ordStatus}.`)
		if (order.ordStatus=='New') break;
		switch (state) {
			case 0:
				if (!isOpen(order)) throw Error('unable to reconstruct trades');
				console.log(`is open`)
				openOrder = order;
				state++;
				break;
			case 1:
				if (order.ordStatus != 'Filled') throw Error('unable to reconstruct trades');
				if (isStopLoss(order)) {
					console.log(`is stop filled`)
					stopLoss = order;
					state = 0;
					trades.push(new Trade(openOrder, stopLoss));
				} else if (isClose(order)) {
					console.log(`is close`)
					closeOrder=order;
					state++;
				} else throw Error('unable to reconstruct trades');
				break;
			case 2: // waiting stopLoss canceled
				if (!isStopLoss(order)) throw Error('unable to reconstruct trades');
				console.log(`is stop`)
				stopLoss = order;
				state = 0;
				trades.push(new Trade(openOrder, stopLoss, closeOrder));
				break;
		}
	}


	return trades;
}

export async function bitmexCandles(env: Env): Promise<Candle[]> {

	let start = 0;
	const to = moment().toISOString();
	let from = moment(to).subtract(10, 'days').toISOString();
	let candles = [];
	let newCandles: Candle[];
	let prepareToExit = false;
	const stopWatch = new StopWatch();
	const candlesTotal = (moment(to).unix() - moment(from).unix()) / 60;
	stopWatch.setTotalSteps(candlesTotal);
	try {
		while (true) {
			stopWatch.setStepsDone(candles.length);
			// console.log('---------------');
			console.log(`Downloading candles:${candles.length} of ${candlesTotal}. last:${last(candles) ? moment.unix(last(candles).timestamp).format() : '/'} (${last(candles) ? last(candles).timestamp : '/'}). ${moment.duration(stopWatch.estimatedTimeRemaining()).humanize()} remaining`);
			newCandles = (await api.makeAuthRequest(
					'/api/v1/trade/bucketed',
					'get',
					{
						binSize: '1m',
						partial: false,
						symbol: env.SYMBOL,
						count: 500,
						start: start,
						startTime: from,
						endTime: to,
					})
			).map(candleFromBitmex);
			// console.log(`${newCandles.length} candles downloaded. first: ${newCandles.length?newCandles[0].timestamp:'/'}, last:${newCandles.length?last(newCandles).timestamp:'/'}`);
			if (newCandles.length == 0) {
				if (prepareToExit)
					break;

				const toMoment = moment(to);
				const lastCandleMoment = moment.unix(last(candles).timestamp);
				if (toMoment.isSameOrBefore(lastCandleMoment))
					break;

				// why 2 works and 1 doesn't? MISTERY.
				from = lastCandleMoment.add(2, 'minute').toISOString();
				if (from == to)
					break;
				start = 0;
				console.log(`FROM moved:${from} (${last(candles).timestamp} + 1 min)`);
				prepareToExit = true;
			} else {
				candles = candles.concat(newCandles);
				start += 500;
				prepareToExit = false;
			}
			await
				new Promise(resolve => setTimeout(resolve, 350));
		}
		candles.forEach((current, index, array) => {
			if (index > 0 && current.timestamp - array[index - 1].timestamp != 60)
				console.log(`*** BAD GAP FROM ${array[index - 1].timestamp} TO ${current.timestamp} ***`);
		});
		return candles;
	} catch (e) {
		console.error('Error downloading candles:', e);
	}

}