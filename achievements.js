// ============================================================================
// ACHIEVEMENTS.JS : PERMANENT CAREER FEATS & PROGRESSIVE CORNER BADGES
// ============================================================================

const Achievements = {
    // Dynamic asset definitions mapping specific feats to themes
    definitions: {
        service: {
            id: 'service',
            name: 'Service Award',
            desc: 'Safely deliver heavy passenger guest volumes inside a single round.',
            bronze: { label: 'Bronze Fish', req: 10, icon: '🟫🐟' },
            silver: { label: 'Silver Fish', req: 30, icon: '⬜🐟' },
            gold: { label: 'Gold Fish', req: 50, icon: '🟨🐟' },
            check: (stats) => stats.servedThisRound
        },
        handsfree: {
            id: 'handsfree',
            name: 'Hands-Free Inventor',
            desc: 'Operate automated transit routines without manual click adjustments.',
            bronze: { label: 'Bronze Automation', req: 2, icon: '🟫🤖' },
            silver: { label: 'Silver Automation', req: 6, icon: '⬜🤖' },
            gold: { label: 'Gold Automation', req: 9, icon: '🟨🤖' },
            check: (stats) => (stats.manualClicks === 0 && Registry.stats.round >= 2) ? Registry.stats.round : 0
        },
        sardine: {
            id: 'sardine',
            name: 'Sardine Packer',
            desc: 'Deliver fully loaded lifts packed perfectly to maximum capacity weight.',
            bronze: { label: 'Bronze Packer', req: 1, icon: '🟫📦' },
            silver: { label: 'Silver Packer', req: 3, icon: '⬜📦' },
            gold: { label: 'Gold Packer', req: 5, icon: '🟨📦' },
            check: (stats) => stats.fullyLoadedLifts
        },
        hacker: {
            id: 'hacker',
            name: 'Hacker Award',
            desc: 'Optimise custom logic to run for thousands of simulation cycles.',
            bronze: { label: 'Bronze Logic', req: 500, icon: '🟫⌨️' },
            silver: { label: 'Silver Logic', req: 5000, icon: '⬜⌨️' },
            gold: { label: 'Master Coder', req: 20000, icon: '🟨⌨️' },
            check: (stats) => Registry.customScriptTicks || 0
        },
        parallel: {
            id: 'parallel',
            name: 'Parallel Universe',
            desc: 'Successfully bridge gaps between shafts using lateral transfer logic.',
            bronze: { label: 'Bronze Bridge', req: 1, icon: '🟫↔️' },
            silver: { label: 'Silver Bridge', req: 10, icon: '⬜↔️' },
            gold: { label: 'Quantum Leap', req: 25, icon: '🟨↔️' },
            check: (stats) => stats.lateralTransfers || 0
        },
        doubleup: {
            id: 'doubleup',
            name: 'Double Trouble',
            desc: 'Utilise double-decker infrastructure to move large volumes of people.',
            bronze: { label: 'Bronze Deck', req: 5, icon: '🟫🚡' },
            silver: { label: 'Silver Deck', req: 15, icon: '⬜🚡' },
            gold: { label: 'Ocean Liner', req: 40, icon: '🟨🚡' },
            check: (stats) => stats.doubleDeckerServed || 0
        }
    },

    // Evaluates shift data, calculates points bank and returns career achievements checklist
    evaluateRound: function() {
        const stats = Registry.roundStats;
        
        // Sanitize Stats: Ensure every key exists to prevent NaN crashes
        const requiredStats = ['servedThisRound', 'happyServed', 'annoyedServed', 'criticalServed', 'defenestrationsThisRound', 'totalWaitTimeServed', 'vipServed'];
        requiredStats.forEach(key => { if (stats[key] === undefined) stats[key] = 0; });

        const generatedPoints = PowerUps.calculateRoundPoints();
        
        // Add dynamic feat point bonuses on top of baseline delivery scores
        let featBonusPoints = 0;
        let logMessages = [];

        // Load current career profile history maps from persistent storage records
        const currentPlayer = Registry.playerName || window.Game.Storage.get(window.Game.Keys.PLAYER, 'Pilot 1');
        const storageKey = window.Game.Keys.ACHIEVEMENTS + currentPlayer;
        let careerLog = JSON.parse(window.Game.Storage.get(storageKey, '{}'));

        Object.values(this.definitions).forEach(feat => {
            const currentVal = feat.check(stats);
            let earnedTier = null;
            let pointVal = 0;

            if (currentVal >= feat.gold.req) { earnedTier = 'gold'; pointVal = 10; }
            else if (currentVal >= feat.silver.req) { earnedTier = 'silver'; pointVal = 5; }
            else if (currentVal >= feat.bronze.req) { earnedTier = 'bronze'; pointVal = 2; }

            if (earnedTier) {
                const priorHighest = careerLog[feat.id]; // 'gold', 'silver', 'bronze' or undefined

                // Validation mapping checking if current feat exceeds career history status records
                let isUpgraded = false;
                if (!priorHighest) isUpgraded = true;
                else if (priorHighest === 'bronze' && (earnedTier === 'silver' || earnedTier === 'gold')) isUpgraded = true;
                else if (priorHighest === 'silver' && earnedTier === 'gold') isUpgraded = true;

                const unicodeIcon = [...feat[earnedTier].icon].join('');

                if (isUpgraded) {
                    careerLog[feat.id] = earnedTier;
                    featBonusPoints += pointVal;
                    logMessages.push(`<span title="${feat.name} - ${feat[earnedTier].label}">${unicodeIcon}</span> UNLOCK: ${feat[earnedTier].label} (+${pointVal} Pts!)`);
                } else {
                    logMessages.push(`<span title="${feat.name} - ${feat[earnedTier].label}">${unicodeIcon}</span> Cleared: ${feat[earnedTier].label}`);
                }
            }
        });

        // Save progress back to career record databases
        window.Game.Storage.set(storageKey, JSON.stringify(careerLog));

        // Commit point transaction balance direct to operational wallet bank
        const netRoundPayout = generatedPoints + featBonusPoints;
        Registry.points += netRoundPayout;

        // Calculate travel delay metrics safely avoiding division by zero errors
        let averageWait = 0;
        if (stats.servedThisRound > 0) {
            averageWait = stats.totalWaitTimeServed / stats.servedThisRound;
        }

        if (logMessages.length === 0) {
            logMessages.push("Round completed cleanly. Optimise scripts further to claim higher elite badges!");
        }

        // Auto-Equip Safety Gateway: Backfill trophy cabinet if scores are tracking empty
        if (Registry.trophyCase.length === 0) {
            Object.keys(careerLog).forEach(featId => {
                if (Registry.trophyCase.length < 6) {
                    Registry.trophyCase.push(`${featId}_${careerLog[featId]}`);
                }
            });
            window.Game.Storage.set(window.Game.Keys.TROPHIES, JSON.stringify(Registry.trophyCase));
        }

        return {
            pointsEarned: netRoundPayout,
            totalPoints: Registry.points,
            guestsServed: stats.servedThisRound,
            averageWaitTime: averageWait.toFixed(1),
            defenestrations: stats.defenestrationsThisRound,
            log: logMessages
        };
    },

    // Renders the visual configuration modal grid window for managing the public Trophy Case entries
    renderTrophyWorkshop: function() {
        let container = document.getElementById('trophyWorkshopContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'trophyWorkshopContainer';
            container.className = 'trophy-workshop-grid';
            
            // Insert cleanly into welcome modal structure panels
            const startBtn = document.getElementById('startRoundBtn');
            if (startBtn) startBtn.parentNode.insertBefore(container, startBtn);
        }

        const currentPlayer = Registry.playerName || window.Game.Storage.get(window.Game.Keys.PLAYER, 'Pilot 1');
        const storageKey = window.Game.Keys.ACHIEVEMENTS + currentPlayer;
        const careerLog = JSON.parse(window.Game.Storage.get(storageKey, '{}'));

        let headerDiv = document.createElement('div');
        headerDiv.style.textAlign = 'left';
        headerDiv.style.marginTop = '20px';
        headerDiv.style.borderTop = '2px solid #ecf0f1';
        headerDiv.style.paddingTop = '15px';
        headerDiv.style.width = '100%';
        
        let subTitle = document.createElement('h4');
        subTitle.style.margin = '0 0 10px 0';
        subTitle.style.color = '#2c3e50';
        subTitle.textContent = '🏆 Career Showcase (Max 6 for Scoreboard)';
        headerDiv.appendChild(subTitle);

        let flexContainer = document.createElement('div');
        flexContainer.style.display = 'flex';
        flexContainer.style.flexWrap = 'wrap';
        flexContainer.style.gap = '8px';
        flexContainer.style.justifyContent = 'flex-start';

        let hasAny = false;
        Object.values(this.definitions).forEach(feat => {
            const highestTier = careerLog[feat.id];
            if (highestTier) {
                hasAny = true;
                const badgeKey = `${feat.id}_${highestTier}`;
                const isSelected = Registry.trophyCase.includes(badgeKey);
                const asset = feat[highestTier];
                const unicodeIcon = [...asset.icon].join('');

                // Tier borders configuration
                let borderStyle = '2px solid #bdc3c7';
                if (highestTier === 'gold') borderStyle = '2px solid #f1c40f';
                else if (highestTier === 'silver') borderStyle = '2px solid #bdc3c7';
                else if (highestTier === 'bronze') borderStyle = '2px solid #cd7f32';

                if (isSelected) {
                    borderStyle = '2px solid #3498db';
                }

                const btn = document.createElement('button');
                btn.title = `${feat.name}: ${asset.label} - ${feat.desc}`;
                btn.style.padding = '8px 14px';
                btn.style.borderRadius = '20px';
                btn.style.fontWeight = 'bold';
                btn.style.cursor = 'pointer';
                btn.style.fontSize = '16px';
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';
                btn.style.gap = '4px';
                btn.style.transition = 'all 0.2s';
                btn.style.border = borderStyle;
                btn.style.background = isSelected ? '#e0f7fa' : '#f8f9fa';
                btn.style.boxShadow = isSelected ? '0 0 8px rgba(52,152,219,0.5)' : 'none';
                
                const span = document.createElement('span');
                span.textContent = unicodeIcon;
                btn.appendChild(span);

                btn.addEventListener('click', () => Achievements.toggleTrophy(badgeKey));
                flexContainer.appendChild(btn);
            }
        });

        if (!hasAny) {
            const emptyHint = document.createElement('span');
            emptyHint.style.fontSize = '12px';
            emptyHint.style.color = '#7f8c8d';
            emptyHint.style.fontStyle = 'italic';
            emptyHint.textContent = 'No career medals unlocked yet. Complete rounds to populate cabinet!';
            flexContainer.appendChild(emptyHint);
        }

        container.replaceChildren(headerDiv, flexContainer);
    },

    toggleTrophy: function(badgeKey) {
        const idx = Registry.trophyCase.indexOf(badgeKey);
        if (idx !== -1) {
            Registry.trophyCase.splice(idx, 1);
        } else {
            if (Registry.trophyCase.length >= 6) {
                if (typeof showToast === 'function') showToast("⚠️ Showcase slots fully occupied! Max 6 items.");
                return;
            }
            Registry.trophyCase.push(badgeKey);
        }
        window.Game.Storage.set(window.Game.Keys.TROPHIES, JSON.stringify(Registry.trophyCase));
        this.renderTrophyWorkshop();
    }
};