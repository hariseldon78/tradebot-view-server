import moment = require('moment');

export function last<T>(a: Array<T>) {
	if (a.length == 0) return null;
	return a[a.length - 1];
}

export class StopWatch {
	startTime;
	totalSteps: number = 0;
	stepsDone: number = 0;

	constructor() {
		this.startTime = moment();
	}

	setTotalSteps(steps: number) {
		this.totalSteps = steps;
	}

	setStepsDone(steps: number) {
		this.stepsDone = steps;
	}

	nextStep() {
		this.stepsDone++;
	}

	elapsedTime() {
		return moment().diff(this.startTime);
	}

	estimatedTimeRemaining() {
		return (this.totalSteps * this.elapsedTime() / this.stepsDone - this.elapsedTime());
	}

	consoleLog(action:string) {
		console.log(`${action}: ${this.stepsDone} of ${this.totalSteps}, ${moment.duration(this.estimatedTimeRemaining()).humanize()} remaining`);
	}
}