// Design-only balance telemetry. This module has no player-facing rendering and
// is intentionally not exposed to the automation bridge.
window.Game = window.Game || {};

window.Game.BalanceTelemetry = {
    forecastHorizonSec: 15,
    reset(now = Date.now()) {
        this.startTime = now;
        this.lifeLossEvents = [];
        this.samples = [];
        this.summary = {
            minimumSurvivalIndex: null,
            secondsInPeril: 0,
            firstPerilSecond: null,
            recoveries: 0,
            peakQueue: 0,
            peakCritical: 0,
            peakQueueByFloor: []
        };
        this.wasInPeril = false;
        this.queueGuestSeconds = 0;
        this.systemGuestSeconds = 0;
        this.productiveLiftSeconds = 0;
        this.availableLiftSeconds = 0;
    },

    recordSpawn(count = 1) {
        Registry.roundStats.guestsSpawned += count;
    },

    recordLifeLoss(now, livesLost, cause = 'guest') {
        this.lifeLossEvents.push({ now, livesLost, cause });
        Registry.roundStats.livesLost += livesLost;
    },

    shiftTime(durationMs) {
        if (this.startTime) this.startTime += durationMs;
        this.lifeLossEvents.forEach(event => { event.now += durationMs; });
    },

    observedLossRate(now, elapsedSec) {
        const windows = [15, 30, 60];
        const weights = [0.5, 0.3, 0.2];
        return windows.reduce((rate, windowSec, index) => {
            const duration = Math.max(1, Math.min(windowSec, elapsedSec));
            const lost = this.lifeLossEvents
                .filter(event => now - event.now <= windowSec * 1000)
                .reduce((sum, event) => sum + event.livesLost, 0);
            return rate + weights[index] * (lost / duration);
        }, 0);
    },

    sample(now = Date.now()) {
        if (!this.startTime) this.reset(now);
        const elapsedSec = Math.max(1, (now - this.startTime) / 1000);
        const guests = [
            ...Registry.floors.flatMap(floor => floor.waitingGuests),
            ...Registry.lifts.flatMap(lift => lift.passengers)
        ];
        const queueLength = Registry.floors.reduce((sum, floor) => sum + floor.waitingGuests.length, 0);
        const onboard = Registry.lifts.reduce((sum, lift) => sum + lift.passengers.length, 0);
        const critical = guests.filter(guest => guest.status === GuestStatus.CRITICAL).length;
        const sortedJourneyTimes = [...Registry.roundStats.journeyTimes].sort((a, b) => a - b);
        const percentile = value => {
            if (!sortedJourneyTimes.length) return 0;
            return sortedJourneyTimes[Math.ceil(value * sortedJourneyTimes.length) - 1];
        };
        const rageAtMs = Config.GAME_DATA.system.patience.critical * 1000;
        const imminentLives = guests.reduce((sum, guest) => {
            const remainingMs = rageAtMs - (now - guest.spawnTime);
            return remainingMs > 0 && remainingMs <= this.forecastHorizonSec * 1000
                ? sum + (guest.isVip ? Config.vipPenalty : 1)
                : sum;
        }, 0);

        const observedLossRate = this.observedLossRate(now, elapsedSec);
        const imminentLossRate = imminentLives / this.forecastHorizonSec;
        const projectedLossRate = observedLossRate + imminentLossRate;
        const projectedTimeToDeath = projectedLossRate > 0
            ? Math.max(0, Registry.stats.lives) / projectedLossRate
            : null;
        const objective = Config.GAME_DATA.rounds[Registry.stats.round].objective;
        const timeRemaining = objective === 'ENDURANCE' ? null : Math.max(0, Registry.stats.timeLeft);
        const projectedSurvivalIndex = projectedTimeToDeath !== null && timeRemaining > 0
            ? projectedTimeToDeath / timeRemaining
            : null;

        const productiveLifts = Registry.lifts.filter(lift => {
            const moving = Math.abs(lift.pos - lift.targetFloor * Registry.floorHeight) > 0.01;
            return (moving && lift.passengers.length > 0) || lift.state === 'BOARDING';
        }).length;
        this.queueGuestSeconds += queueLength;
        this.systemGuestSeconds += queueLength + onboard;
        this.productiveLiftSeconds += productiveLifts;
        this.availableLiftSeconds += Registry.lifts.length;

        const arrivalRate = Registry.roundStats.guestsSpawned / elapsedSec;
        const deliveryRate = Registry.roundStats.servedThisRound / elapsedSec;
        const averageJourneyTime = Registry.roundStats.servedThisRound > 0
            ? Registry.roundStats.totalWaitTimeServed / Registry.roundStats.servedThisRound
            : 0;
        const averageSystemGuests = this.systemGuestSeconds / (this.samples.length + 1);
        const littlesLawEstimate = arrivalRate * averageJourneyTime;
        const inPeril = projectedSurvivalIndex !== null && projectedSurvivalIndex < 1;

        if (inPeril) {
            this.summary.secondsInPeril++;
            if (this.summary.firstPerilSecond === null) this.summary.firstPerilSecond = elapsedSec;
            if (this.summary.minimumSurvivalIndex === null || projectedSurvivalIndex < this.summary.minimumSurvivalIndex) {
                this.summary.minimumSurvivalIndex = projectedSurvivalIndex;
            }
        } else if (this.wasInPeril && projectedSurvivalIndex !== null) {
            this.summary.recoveries++;
        }
        this.wasInPeril = inPeril;
        this.summary.peakQueue = Math.max(this.summary.peakQueue, queueLength);
        this.summary.peakCritical = Math.max(this.summary.peakCritical, critical);
        Registry.floors.forEach((floor, index) => {
            this.summary.peakQueueByFloor[index] = Math.max(
                this.summary.peakQueueByFloor[index] || 0,
                floor.waitingGuests.length
            );
        });

        const sample = {
            elapsedSec,
            timeRemaining,
            livesRemaining: Registry.stats.lives,
            queueLength,
            onboard,
            critical,
            imminentLives,
            arrivalRate,
            deliveryRate,
            observedLossRate,
            projectedLossRate,
            projectedTimeToDeath,
            projectedSurvivalIndex,
            liftUtilisation: this.availableLiftSeconds > 0 ? this.productiveLiftSeconds / this.availableLiftSeconds : 0,
            manualDecisionsPerMinute: Registry.roundStats.manualClicks / elapsedSec * 60,
            averageSystemGuests,
            averageJourneyTime,
            medianJourneyTime: percentile(0.5),
            p90JourneyTime: percentile(0.9),
            maximumJourneyTime: sortedJourneyTimes.length ? sortedJourneyTimes[sortedJourneyTimes.length - 1] : 0,
            littlesLawEstimate,
            littlesLawResidual: averageSystemGuests - littlesLawEstimate
        };
        this.samples.push(sample);
        return sample;
    },

    export() {
        return JSON.parse(JSON.stringify({
            balanceVersion: Config.balanceVersion,
            round: Registry.stats.round,
            seed: Registry.seed,
            summary: this.summary,
            samples: this.samples
        }));
    }
};
