// ============================================================================
// UI-LEADERBOARD.JS : SCOREBOARD, SHARING, & ARCADE TELEMETRY
// ============================================================================

const GameEngine = () => (window.Game && window.Game.Engine) || window;
const GameUI = () => (window.Game && window.Game.UI) || window.UI || {};
const GameShared = () => window.Game || window;

/**
 * Share the current local leaderboard via a data URL payload.
 */
window.shareLeaderboard = function() {
    const ui = GameUI();
    const shared = GameShared();
    const localScores = JSON.parse(window.Game.Storage.get(window.Game.Keys.LEADERBOARD, '[]'));
    if (localScores.length === 0) {
        if (typeof ui.showToast === 'function') ui.showToast("No scores to share yet! Play a round first.");
        return;
    }
    
    const payload = { type: 'leaderboard', data: localScores };
    if (typeof shared.encodePayload === 'function') {
        const encoded = shared.encodePayload(payload);
        const shareUrl = window.location.origin + window.location.pathname + '?Data=' + encoded;
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            if (typeof ui.showToast === 'function') ui.showToast("🔗 Leaderboard Link Copied to Clipboard!");
        }).catch(err => {
            console.error("Could not copy text: ", err);
            if (typeof ui.showToast === 'function') ui.showToast("Failed to copy link.");
        });
    }
};

/**
 * Share the current game seed configuration.
 */
window.shareGame = function() {
    let seed = Registry.seed;
    const payload = { type: 'seed', value: seed };
    
    const shared = GameShared();
    const ui = GameUI();
    if (typeof shared.encodePayload === 'function') {
        const encoded = shared.encodePayload(payload);
        const shareUrl = window.location.origin + window.location.pathname + '?Data=' + encoded;
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            if (typeof ui.showToast === 'function') ui.showToast("🔗 Seed Configuration Link Saved to Clipboard!");
        }).catch(err => {
            console.error("Could not copy text: ", err);
            if (typeof ui.showToast === 'function') ui.showToast("Failed to copy link.");
        });
    }
};

/**
 * Open the leaderboard overlay and populate it with scores.
 */
window.showLeaderboard = function(titleText) {
    const engine = GameEngine();
    const ui = GameUI();
    if (typeof engine.pause === 'function') engine.pause(); 
    if (document.getElementById('lbTitle')) document.getElementById('lbTitle').innerText = titleText;
    
    const closeBtn = document.getElementById('closeLbBtn');
    const restartBtn = document.getElementById('lbRestartBtn');
    
    let shareBtn = document.getElementById('shareLbBtn');
    if (!shareBtn && document.getElementById('leaderboardOverlay')) {
        const contentBox = document.getElementById('leaderboardOverlay').querySelector('.modal-content');
        if (contentBox) {
            shareBtn = document.createElement('button');
            shareBtn.id = 'shareLbBtn';
            shareBtn.innerText = '🔗 Share Board';
            shareBtn.className = 'btn btn-blue btn-full-width btn-margin-top';
            shareBtn.onclick = () => { if (typeof ui.shareLeaderboard === 'function') ui.shareLeaderboard(); };
            const listEl = document.getElementById('lbList');
            if(listEl) listEl.parentNode.insertBefore(shareBtn, listEl.nextSibling);
        }
    }

    if (closeBtn) closeBtn.style.display = (titleText === "Game Over!" || titleText === "You Won!") ? "none" : "block";
    if (restartBtn) restartBtn.style.display = (titleText === "Game Over!" || titleText === "You Won!") ? "block" : "none";
    if (shareBtn) shareBtn.style.display = 'block';

    const listContainer = document.getElementById('lbList');
    if (listContainer) {
        listContainer.innerHTML = '';
        const records = JSON.parse(window.Game.Storage.get(window.Game.Keys.LEADERBOARD, '[]'));
        if (records.length === 0) {
            listContainer.innerHTML = '<li>No scores registered yet!</li>';
        } else {
            records.slice(0, 10).forEach((record, index) => { 
                let badgeIcons = "";
                if (record.trophies && Array.isArray(record.trophies)) {
                    record.trophies.forEach(tKey => {
                        const parts = tKey.split('_');
                        if (parts.length >= 2) {
                            const icon = parts[1];
                            badgeIcons += ` <span title="${tKey}">${icon}</span>`;
                        }
                    });
                }
                const li = document.createElement('li');
                li.innerHTML = `<span>#${index + 1} ${record.name} ${badgeIcons}</span> <strong>${record.score}</strong>`;
                listContainer.appendChild(li);
            });
        }
    }
    
    document.getElementById('leaderboardOverlay').style.display = 'flex';
};
