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

window.Game.Feedback.copyDiagnostic = async function(context, suppliedDiagnostic) {
    const diagnostic = suppliedDiagnostic || window.Game.Feedback.getDiagnostic(context);
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

window.Game.Feedback.getFormUrl = function(diagnostic) {
    const release = window.LiftOperatorRelease || {};
    if (!release.feedbackFormUrl) return '';
    try {
        const formUrl = new URL(release.feedbackFormUrl, window.location.href);
        if (release.feedbackDiagnosticEntry) {
            formUrl.searchParams.set('usp', 'pp_url');
            formUrl.searchParams.set(release.feedbackDiagnosticEntry, diagnostic);
        }
        return formUrl.toString();
    } catch (_) {
        return release.feedbackFormUrl;
    }
};

window.Game.Feedback.open = async function(context) {
    const diagnostic = window.Game.Feedback.getDiagnostic(context);
    const url = window.Game.Feedback.getFormUrl(diagnostic);
    // Open during the trusted click gesture. Awaiting clipboard access first can
    // cause browsers to treat this as an unsolicited popup.
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    const result = await window.Game.Feedback.copyDiagnostic(context, diagnostic);
    if (url) {
        window.showToast?.(result.copied
            ? 'Feedback form opened with game details pre-filled. Diagnostics copied too.'
            : 'Feedback form opened with game details pre-filled.');
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
