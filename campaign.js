// ============================================================================
// CAMPAIGN.JS : VERSIONED, LOCAL-ONLY PRE-ROUND CAMPAIGN CHECKPOINTS
// ============================================================================
(function() {
    const schemaVersion = 1;
    const maxRound = () => Math.max(...Object.keys(Config.GAME_DATA.rounds || { 1: {} }).map(Number));
    const cloneInventory = (inventory) => Array.isArray(inventory)
        ? inventory.filter(item => item && typeof item.id === 'string' && Number.isInteger(item.tier))
            .map(item => ({ id: item.id, tier: item.tier }))
        : [];
    const clonePromotions = (promotions) => Array.isArray(promotions)
        ? [...new Set(promotions.filter(round => Number.isInteger(round) && Config.GAME_DATA.rounds[round]?.briefing?.promotion))]
        : [];
    const normalizeSeed = (seed) => window.Game.Seed?.normalize?.(seed) || 1234;
    const randomSeed = () => {
        if (window.crypto?.getRandomValues) {
            const values = new Uint32Array(1);
            window.crypto.getRandomValues(values);
            return normalizeSeed(values[0]);
        }
        return normalizeSeed(Math.floor(Math.random() * 2147483646) + 1);
    };
    const deriveRoundSeed = (campaignSeed, round) => {
        let value = normalizeSeed(campaignSeed) ^ (Math.imul(Number(round) || 1, 0x45d9f3b) >>> 0);
        value = Math.imul(value ^ (value >>> 16), 0x45d9f3b) >>> 0;
        value = Math.imul(value ^ (value >>> 13), 0x45d9f3b) >>> 0;
        return normalizeSeed(value ^ (value >>> 16));
    };

    const parse = () => {
        const raw = Game.Storage.get(Game.Keys.CAMPAIGN, '');
        if (!raw) return null;
        try {
            const value = JSON.parse(raw);
            const valid = value && value.schemaVersion === schemaVersion &&
                value.balanceVersion === Config.balanceVersion && typeof value.playerName === 'string' &&
                value.playerName.trim() && Number.isInteger(value.seed) && Number.isInteger(value.round) &&
                value.round >= 1 && value.round <= maxRound() && Number.isFinite(value.points) &&
                Number.isFinite(value.lives) && Number.isInteger(value.highestUnlockedRound);
            return valid ? value : null;
        } catch (error) { return null; }
    };

    Game.Campaign = {
        load: parse,
        generateSeed: randomSeed,
        deriveRoundSeed,
        clear: () => {
            Registry.promotionAcknowledgements = [];
            try { localStorage.removeItem(Game.Keys.CAMPAIGN); } catch (error) {}
        },
        shouldShowPromotion: (round) => Boolean(
            Config.GAME_DATA.rounds[round]?.briefing?.promotion &&
            !clonePromotions(Registry.promotionAcknowledgements).includes(round)
        ),
        acknowledgePromotion: (round) => {
            if (!Config.GAME_DATA.rounds[round]?.briefing?.promotion) return false;
            Registry.promotionAcknowledgements = clonePromotions([...Registry.promotionAcknowledgements, round]);
            if (Registry.playerName && !Registry.debugSession) Game.Campaign.saveCurrent();
            return true;
        },
        saveCurrent: (options = {}) => {
            if (!Registry.playerName || Registry.debugSession) return null;
            const record = {
                schemaVersion,
                balanceVersion: Config.balanceVersion,
                playerName: Registry.playerName,
                seed: Number.isInteger(Registry.campaignSeed) && Registry.useCampaignSeeds
                    ? Registry.campaignSeed
                    : (Number.isInteger(Registry.seed) ? Registry.seed : 1234),
                round: Math.max(1, Math.min(maxRound(), Number(options.round || Registry.stats.round) || 1)),
                highestUnlockedRound: Math.max(1, Math.min(maxRound(), Number(options.highestUnlockedRound || Registry.highestUnlockedRound) || 1)),
                lives: Math.max(0, Number(options.lives ?? Registry.stats.lives) || 0),
                points: Math.max(0, Number(options.points ?? Registry.points) || 0),
                inventory: cloneInventory(options.inventory ?? (typeof PowerUps !== 'undefined' ? PowerUps.inventory : [])),
                promotionAcknowledgements: clonePromotions(options.promotionAcknowledgements ?? Registry.promotionAcknowledgements),
                completed: Boolean(options.completed)
            };
            Game.Storage.set(Game.Keys.CAMPAIGN, JSON.stringify(record));
            return record;
        },
        restore: (record = parse()) => {
            if (!record) return false;
            Registry.playerName = record.playerName;
            Registry.campaignSeed = normalizeSeed(record.seed);
            Registry.useCampaignSeeds = true;
            Registry.seed = Registry.campaignSeed;
            Registry.points = record.points;
            Registry.highestUnlockedRound = record.highestUnlockedRound;
            Registry.promotionAcknowledgements = clonePromotions(record.promotionAcknowledgements);
            Game.Storage.set(Game.Keys.PLAYER, record.playerName);
            window.initializeRound(record.round, {
                showBriefing: false,
                restoredLives: record.lives,
                restoredInventory: cloneInventory(record.inventory),
                preserveCheckpoint: false
            });
            const ui = GameUI();
            ui.updatePilotNameDisplay?.();
            ui.updateLocksUI?.();
            ui.updateInventoryUI?.();
            if (record.completed) Game.Shell?.showCampaignComplete?.();
            else ui.showRoundModal?.(record.round, { showPromotion: false });
            return true;
        }
    };

    const show = (id) => window.openModalExclusive?.(id);
    Game.Shell = {
        infoReturnId: 'welcomeOverlay',
        showWelcome: () => {
            const save = Game.Campaign.load();
            const start = document.getElementById('welcomeStartBtn');
            const newGame = document.getElementById('welcomeNewGameBtn');
            if (start) start.textContent = save ? `Continue: Round ${save.round}` : 'Play';
            if (newGame) newGame.classList.toggle('hidden', !save);
            show('welcomeOverlay');
        },
        start: () => {
            const save = Game.Campaign.load();
            if (save) return Game.Campaign.restore(save);
            const ui = GameUI();
            ui.showRoundModal?.(Registry.stats.round, { showPromotion: Registry.stats.round === 1 });
            return true;
        },
        requestNewGame: () => {
            if (Registry.debugSession) {
                window.resetGame?.({ showBriefing: true, preserveDebugSession: true });
                return;
            }
            show('newGameConfirmOverlay');
        },
        showInfo: (id) => {
            const current = ['welcomeOverlay', 'settingsOverlay', 'campaignCompleteOverlay']
                .find(candidate => document.getElementById(candidate)?.style.display === 'flex');
            Game.Shell.infoReturnId = current || 'welcomeOverlay';
            show(id);
            if (id === 'creditsOverlay') {
                const creditLines = document.querySelectorAll('#creditsOverlay .shell-modal > p');
                if (creditLines[2]) creditLines[2].innerHTML = 'Made with <span class="melbourne-heart" aria-label="love">♥</span> in Melbourne, Australia.';
                Game.Audio?.renderAttributions?.();
            }
        },
        closeInfo: () => show(Game.Shell.infoReturnId || 'welcomeOverlay'),
        beginNewGame: () => {
            Game.Campaign.clear();
            document.getElementById('newGameConfirmOverlay')?.style.setProperty('display', 'none');
            document.getElementById('campaignCompleteOverlay')?.style.setProperty('display', 'none');
            window.resetGame?.();
        },
        clearLocalData: () => {
            if (!Game.Storage.clearLiftOperatorData()) return false;
            window.location.reload();
            return true;
        },
        showCampaignComplete: () => {
            Game.Campaign.saveCurrent({ round: maxRound(), completed: true, inventory: [] });
            show('campaignCompleteOverlay');
        }
    };
})();
