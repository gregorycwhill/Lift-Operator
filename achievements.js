// ============================================================================
// ACHIEVEMENTS.JS : PERMANENT CAREER FEATS & PROGRESSIVE CORNER BADGES
// ============================================================================

const Achievements = {
    // Dynamic asset definitions mapping specific feats to themes
    definitions: {
        service: {
            id: 'service',
            name: 'Service Award',
            desc: 'Safely deliver heavy passenger guest volumes inside a single shift.',
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
        const currentPlayer = Registry.playerName || safeGetItem('lastPlayer', 'Pilot 1');
        const storageKey = `liftOperator_achievements_${currentPlayer}`;
        let careerLog = JSON.parse(safeGetItem(storageKey, '{}'));

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
        safeSetItem(storageKey, JSON.stringify(careerLog));

        // Commit point transaction balance direct to operational wallet bank
        const netRoundPayout = generatedPoints + featBonusPoints;
        Registry.points += netRoundPayout;

        // Calculate travel delay metrics safely avoiding division by zero errors
        let averageWait = 0;
        if (stats.servedThisRound > 0) {
            averageWait = stats.totalWaitTimeServed / stats.servedThisRound;
        }

        if (logMessages.length === 0) {
            logMessages.push("Shift completed cleanly. Optimize scripts further to claim higher elite badges!");
        }

        // Auto-Equip Safety Gateway: Backfill trophy cabinet if scores are tracking empty
        if (Registry.trophyCase.length === 0) {
            Object.keys(careerLog).forEach(featId => {
                if (Registry.trophyCase.length < 6) {
                    Registry.trophyCase.push(`${featId}_${careerLog[featId]}`);
                }
            });
            safeSetItem('liftOperator_activeTrophies', JSON.stringify(Registry.trophyCase));
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

        const currentPlayer = Registry.playerName || safeGetItem('lastPlayer', 'Pilot 1');
        const storageKey = `liftOperator_achievements_${currentPlayer}`;
        const careerLog = JSON.parse(safeGetItem(storageKey, '{}'));

        let html = `
        <div style="text-align:left; margin-top:20px; border-top:2px solid #ecf0f1; padding-top:15px; width:100%;">
            <h4 style="margin:0 0 10px 0; color:#2c3e50;">🏆 Career Showcase (Max 6 for Scoreboard)</h4>
            <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-start;">`;

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

                html += `
                <button onclick="Achievements.toggleTrophy('${badgeKey}')" 
                    title="${feat.name}: ${asset.label} - ${feat.desc}"
                    style="padding:8px 14px; border-radius:20px; font-weight:bold; cursor:pointer; font-size:16px; display:flex; align-items:center; gap:4px; transition:all 0.2s;
                    border:${borderStyle}; 
                    background:${isSelected ? '#e0f7fa' : '#f8f9fa'};
                    box-shadow:${isSelected ? '0 0 8px rgba(52,152,219,0.5)' : 'none'};">
                    <span>${unicodeIcon}</span>
                </button>`;
            }
        });

        if (!hasAny) {
            html += `<span style="font-size:12px; color:#7f8c8d; font-style:italic;">No career medals unlocked yet. Complete shifts to populate cabinet!</span>`;
        }

        html += `</div></div>`;
        container.innerHTML = html;
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
        safeSetItem('liftOperator_activeTrophies', JSON.stringify(Registry.trophyCase));
        this.renderTrophyWorkshop();
    }
};