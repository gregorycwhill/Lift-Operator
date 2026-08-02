// Release-facing configuration. Change feedbackFormUrl to a hosted external form
// when one is chosen; the game copies diagnostics locally and never transmits them.
window.LiftOperatorRelease = Object.freeze({
    buildVersion: 'RC1.0-playtest',
    distribution: 'GitHub Pages',
    feedbackFormUrl: 'https://github.com/gregorycwhill/Lift-Operator/issues/new/choose'
});
