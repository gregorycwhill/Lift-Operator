// ENVIRONMENT-GUARD.JS : NON-BLOCKING RC1 DESKTOP COMPATIBILITY NOTICE

window.Game = window.Game || {};
window.Game.Environment = {
    detectEnvironment({ userAgent = '', maxTouchPoints = 0 } = {}) {
        const ua = String(userAgent);
        const lower = ua.toLowerCase();
        const isFirefox = /firefox|fxios/i.test(ua);
        const isEdge = /edg\//i.test(ua);
        const isChromium = /chrome\//i.test(ua) || /chromium\//i.test(ua) || /crios\//i.test(ua);
        const isSafari = /safari\//i.test(ua) && !isChromium && !isEdge && !isFirefox;
        const isAndroid = /android/i.test(ua);
        const isIPhone = /iphone|ipod/i.test(ua);
        const isIPad = /ipad/i.test(ua) || (/macintosh/i.test(ua) && Number(maxTouchPoints) > 1);
        const isMobile = isAndroid || isIPhone || isIPad || /mobile|tablet|silk|kindle/i.test(ua);
        const isTablet = isIPad || /tablet/i.test(ua) || (isAndroid && !/mobile/i.test(ua));
        const browser = isEdge ? 'Edge' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isChromium ? 'Chrome' : 'another browser';
        const device = isTablet ? 'a tablet' : isMobile ? 'a mobile device' : 'a desktop or laptop';
        return {
            browser,
            device,
            label: `${browser} on ${device}`,
            isMobile,
            isTablet,
            supported: !isMobile && (isEdge || isChromium),
            userAgent: lower
        };
    },

    shouldGuard() {
        // Playwright and other automated harnesses exercise the pure detector
        // explicitly; they should not inherit a player-facing modal.
        if (navigator.webdriver && !new URLSearchParams(window.location.search).has('testEnvironmentGuard')) return false;
        return true;
    },

    show(environment) {
        const notice = document.getElementById('environmentNoticeOverlay');
        const label = document.getElementById('environmentNoticeDetected');
        if (!notice) return false;
        if (label) label.textContent = environment.label;
        window.openModalExclusive?.('environmentNoticeOverlay');
        return true;
    },

    init() {
        if (!this.shouldGuard()) return false;
        const environment = this.detectEnvironment({
            userAgent: navigator.userAgent,
            maxTouchPoints: navigator.maxTouchPoints || 0
        });
        if (environment.supported) return false;
        return this.show(environment);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.Game.Environment.init();
    document.getElementById('environmentNoticeContinue')?.addEventListener('click', () => {
        document.getElementById('environmentNoticeOverlay')?.style.setProperty('display', 'none');
        window.Game.Shell?.showWelcome?.();
    });
});
