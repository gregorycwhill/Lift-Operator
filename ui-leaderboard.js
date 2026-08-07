// ============================================================================
// UI-LEADERBOARD.JS : SCOREBOARD, SHARING, & ARCADE TELEMETRY
// ============================================================================

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
        
        const shareData = {
            title: 'Lift Operator Leaderboard',
            text: 'Check out these high scores!',
            url: shareUrl
        };

        if (navigator.share) {
            navigator.share(shareData).catch(() => {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    if (typeof ui.showToast === 'function') ui.showToast("🔗 Leaderboard Link Copied to Clipboard!");
                });
            });
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                if (typeof ui.showToast === 'function') ui.showToast("🔗 Leaderboard Link Copied to Clipboard!");
            }).catch(err => {
                console.error("Could not copy text: ", err);
                if (typeof ui.showToast === 'function') ui.showToast("Failed to copy link.");
            });
        }
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
        
        const shareData = {
            title: 'Lift Operator',
            text: `Try this Lift Operator seed: ${seed}`,
            url: shareUrl
        };

        if (navigator.share) {
            navigator.share(shareData).catch(() => {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    if (typeof ui.showToast === 'function') ui.showToast("🔗 Seed Configuration Link Saved to Clipboard!");
                });
            });
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                if (typeof ui.showToast === 'function') ui.showToast("🔗 Seed Configuration Link Saved to Clipboard!");
            }).catch(err => {
                console.error("Could not copy text: ", err);
                if (typeof ui.showToast === 'function') ui.showToast("Failed to copy link.");
            });
        }
    }
};

/**
 * Open the leaderboard overlay and populate it with scores.
 */
window.showLeaderboard = function(titleText) {
    if (window.Game.Audio) window.Game.Audio.setContext('menu');
    if (titleText === 'You Won!' && window.Game.Audio) window.Game.Audio.publish('victory');
    const engine = GameEngine();
    const ui = GameUI();
    if (typeof engine.pause === 'function') engine.pause(); 
    if (Registry.roundCountdownActive && Registry.roundCountdownTimer) {
        clearInterval(Registry.roundCountdownTimer);
        Registry.roundCountdownTimer = null;
    }
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
    const audio = window.Game.Audio;
    const mute = document.getElementById('audioMute'), music = document.getElementById('audioMusic'), sfx = document.getElementById('audioSfx');
    if (audio && mute && music && sfx) {
        const settings = audio.getSettings(); mute.checked = settings.muted; music.value = settings.music; sfx.value = settings.sfx;
        mute.onchange = () => audio.setMuted(mute.checked); music.oninput = () => audio.setVolume('music', music.value); sfx.oninput = () => audio.setVolume('sfx', sfx.value);
    }
    audio?.renderAttributions?.();
    if (listContainer) {
        listContainer.innerHTML = '';
        const records = JSON.parse(window.Game.Storage.get(window.Game.Keys.LEADERBOARD, '[]'));
        if (records.length === 0) {
            listContainer.innerHTML = '<li>No scores registered yet!</li>';
        } else {
            records.slice(0, 10).forEach((record, index) => { 
                const li = document.createElement('li');
                const name = document.createElement('span'); name.textContent = `#${index + 1} ${String(record.name || 'Operator').slice(0, 120)}`;
                const score = document.createElement('strong'); score.textContent = String(Number(record.score) || 0);
                li.append(name, score);
                listContainer.appendChild(li);
            });
        }
    }
    
    window.openModalExclusive('leaderboardOverlay');
};

window.showSettings = function() {
    if (window.Game.Audio) window.Game.Audio.setContext('menu');
    const engine = GameEngine();
    if (typeof engine.pause === 'function') engine.pause();
    const audio = window.Game.Audio;
    const mute = document.getElementById('settingsAudioMute');
    const music = document.getElementById('settingsAudioMusic');
    const sfx = document.getElementById('settingsAudioSfx');
    if (audio && mute && music && sfx) {
        const settings = audio.getSettings();
        mute.checked = settings.muted;
        music.value = settings.music;
        sfx.value = settings.sfx;
        mute.onchange = () => audio.setMuted(mute.checked);
        music.oninput = () => audio.setVolume('music', music.value);
        sfx.oninput = () => audio.setVolume('sfx', sfx.value);
    }
    audio?.renderAttributions?.();
    /* Retired RC1.0 achievement panel.
    const container = document.getElementById('settingsAchievements');
    if (container) {
        const player = Registry.playerName || window.Game.Storage.get(window.Game.Keys.PLAYER, 'Pilot 1');
        const record = JSON.parse(window.Game.Storage.get(window.Game.Keys.ACHIEVEMENTS + player, '{}'));
        const definitions = typeof Achievements !== 'undefined' ? Achievements.definitions : {};
        container.innerHTML = Object.values(definitions).map(feat => {
            const tier = record[feat.id];
            const asset = tier && feat[tier];
            return `<div class="settings-achievement ${asset ? 'earned' : ''}">${asset ? asset.icon : '○'} <span>${feat.name}</span><small>${asset ? asset.label : 'Locked'}</small></div>`;
        }).join('') || '<p>No achievements recorded yet.</p>';
    }
    */
    window.openModalExclusive('settingsOverlay');
};
