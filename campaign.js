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
        clear: () => { try { localStorage.removeItem(Game.Keys.CAMPAIGN); } catch (error) {} },
        saveCurrent: (options = {}) => {
            if (!Registry.playerName) return null;
            const record = {
                schemaVersion,
                balanceVersion: Config.balanceVersion,
                playerName: Registry.playerName,
                seed: Number.isInteger(Registry.seed) ? Registry.seed : 1234,
                round: Math.max(1, Math.min(maxRound(), Number(options.round || Registry.stats.round) || 1)),
                highestUnlockedRound: Math.max(1, Math.min(maxRound(), Number(options.highestUnlockedRound || Registry.highestUnlockedRound) || 1)),
                lives: Math.max(0, Number(options.lives ?? Registry.stats.lives) || 0),
                points: Math.max(0, Number(options.points ?? Registry.points) || 0),
                inventory: cloneInventory(options.inventory ?? (typeof PowerUps !== 'undefined' ? PowerUps.inventory : [])),
                completed: Boolean(options.completed)
            };
            Game.Storage.set(Game.Keys.CAMPAIGN, JSON.stringify(record));
            return record;
        },
        restore: (record = parse()) => {
            if (!record) return false;
            Registry.playerName = record.playerName;
            Registry.seed = record.seed;
            Registry.points = record.points;
            Registry.highestUnlockedRound = record.highestUnlockedRound;
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
            else ui.showRoundModal?.(record.round);
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
            show('roundModalOverlay');
            return true;
        },
        requestNewGame: () => show('newGameConfirmOverlay'),
        showInfo: (id) => {
            const current = ['welcomeOverlay', 'settingsOverlay', 'campaignCompleteOverlay']
                .find(candidate => document.getElementById(candidate)?.style.display === 'flex');
            Game.Shell.infoReturnId = current || 'welcomeOverlay';
            show(id);
            if (id === 'creditsOverlay') Game.Audio?.renderAttributions?.();
        },
        closeInfo: () => show(Game.Shell.infoReturnId || 'welcomeOverlay'),
        beginNewGame: () => {
            Game.Campaign.clear();
            document.getElementById('newGameConfirmOverlay')?.style.setProperty('display', 'none');
            document.getElementById('campaignCompleteOverlay')?.style.setProperty('display', 'none');
            window.resetGame?.();
        },
        showCampaignComplete: () => {
            Game.Campaign.saveCurrent({ round: maxRound(), completed: true, inventory: [] });
            show('campaignCompleteOverlay');
        }
    };
})();
