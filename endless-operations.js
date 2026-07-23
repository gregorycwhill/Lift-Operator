// ENDLESS-OPERATIONS.JS : CONSTRAINED, SEEDED PLAYTEST GENERATOR

window.Game = window.Game || {};

window.Game.EndlessOperations = {
    version: 'endless-alpha.v1',
    templates: [14, 15, 16, 17, 18, 19, 20],

    random(seed) {
        let value = (Math.abs(Number(seed) || 1) % 2147483647) || 1;
        return () => {
            value = (value * 48271) % 2147483647;
            return (value - 1) / 2147483646;
        };
    },

    generate(seed) {
        const random = this.random(seed);
        const templateRound = this.templates[Math.floor(random() * this.templates.length)];
        const template = window.GameBalanceData.rounds[templateRound];
        const floors = template.floors;
        const lifts = template.lifts;
        const pressure = 0.94 + random() * 0.12;
        const operation = {
            id: `endless-${Math.abs(Number(seed) || 1)}-${templateRound}`,
            mode: 'endless-alpha',
            version: this.version,
            round: templateRound,
            seed: Math.abs(Number(seed) || 1),
            templateRound,
            floors,
            lifts,
            spawnStart: Number((template.spawnStart * pressure).toFixed(4)),
            spawnEnd: Number((template.spawnEnd * pressure).toFixed(4)),
            objective: 'SURVIVAL',
            gravityScalar: template.gravityScalar || 0,
            zoningEnabled: true,
            vipEvent: Boolean(template.vipEvent),
            rooftopEvent: Boolean(template.rooftopEvent),
            jamEvent: Boolean(template.jamEvent),
            stinkEvent: Boolean(template.stinkEvent),
            gymEvent: Boolean(template.gymEvent),
            checkoutEvent: Boolean(template.checkoutEvent),
            objectiveText: 'Survive the generated hotel operation.',
            difficultyEnvelope: { minFloors: 20, maxFloors: 30, minLifts: 5, maxLifts: 10 },
            supportedStrategyProfile: 'manual-or-hybrid-zoning',
            generationInputs: { seed: Math.abs(Number(seed) || 1), templateRound, pressure: Number(pressure.toFixed(6)) }
        };
        return this.validate(operation) ? { ...operation, prechecked: true } : null;
    },

    validate(operation) {
        if (!operation || operation.version !== this.version || operation.objective !== 'SURVIVAL') return false;
        const envelope = operation.difficultyEnvelope || {};
        if (!Number.isInteger(operation.floors) || operation.floors < envelope.minFloors || operation.floors > envelope.maxFloors) return false;
        if (!Number.isInteger(operation.lifts) || operation.lifts < envelope.minLifts || operation.lifts > envelope.maxLifts) return false;
        if (!(operation.spawnStart > 0) || !(operation.spawnEnd >= operation.spawnStart)) return false;
        if (!operation.supportedStrategyProfile || !operation.generationInputs) return false;
        return true;
    },

    createPrechecked(seed) {
        return this.generate(seed);
    }
};
