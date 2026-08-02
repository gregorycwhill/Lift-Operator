// ============================================================================
// UI-FEEDBACK.JS : OPT-IN EXTERNAL FEEDBACK AND LOCAL DIAGNOSTICS
// ============================================================================

window.Game = window.Game || {};
window.Game.Feedback = window.Game.Feedback || {};

window.Game.Feedback.getDiagnostic = function(context = 'gameplay') {
    const release = window.LiftOperatorRelease || {};
    const round = window.Registry?.stats?.round ?? 'unknown';
    const seed = window.Registry?.seed ?? 'unknown';
    const balance = window.Config?.balanceVersion ?? 'unknown';
    const viewport = `${window.innerWidth || 0}x${window.innerHeight || 0}`;
    return `Lift Operator | build=${release.buildVersion || 'development'} | balance=${balance} | context=${context} | round=${round} | seed=${seed} | browser=${navigator.userAgent} | viewport=${viewport}`;
};

window.Game.Feedback.copyDiagnostic = async function(context) {
    const diagnostic = window.Game.Feedback.getDiagnostic(context);
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(diagnostic);
            return { diagnostic, copied: true };
        }
    } catch (_) {
        // Fall through to the local selection fallback. Feedback remains opt-in.
    }
    const fallback = document.createElement('textarea');
    fallback.value = diagnostic;
    fallback.setAttribute('readonly', '');
    fallback.style.position = 'fixed';
    fallback.style.opacity = '0';
    document.body.appendChild(fallback);
    fallback.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) { /* selection still permits manual copy */ }
    fallback.remove();
    return { diagnostic, copied };
};

window.Game.Feedback.open = async function(context) {
    const result = await window.Game.Feedback.copyDiagnostic(context);
    const url = window.LiftOperatorRelease?.feedbackFormUrl;
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        window.showToast?.(result.copied
            ? 'Diagnostics copied. Paste them into the Google Form.'
            : 'Google Form opened. Copy diagnostics from the browser if needed.');
    } else {
        window.showToast?.(result.copied
            ? 'Diagnostics copied. Google Form URL is not configured yet.'
            : 'Google Form URL is not configured yet.');
    }
    return result;
};

window.Game.Feedback.renderBuildLabels = function() {
    const release = window.LiftOperatorRelease || {};
    const text = `Build ${release.buildVersion || 'development'} · Balance ${window.Config?.balanceVersion || 'unknown'}`;
    document.querySelectorAll('[data-build-version]').forEach(element => { element.textContent = text; });
};
