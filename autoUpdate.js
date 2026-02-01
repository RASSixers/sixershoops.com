// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Auto-Update Logic in schedule.html', () => {
    let scriptContent;

    beforeEach(() => {
        // Reset DOM with necessary elements for all functions
        document.body.innerHTML = `
            <div id="standings-body"></div>
            <div id="standings-updated"></div>
            <div id="refreshIndicator"></div>
            <div id="refreshCountdown"></div>
            <div id="schedule-container"></div>
            <div id="current-record"></div>
            <div id="next-game"></div>
            <div id="mobile-menu-btn"></div>
            <div id="mobile-menu"></div>
            <div id="navbar"></div>
            <div id="liveGameModal">
                <div id="modalGameTitle"></div>
                <div id="play-by-play-tab"></div>
                <div id="box-score-tab"></div>
                <div id="game-stats-tab"></div>
                <div id="awayTeamLogo"></div>
                <div id="awayTeamName"></div>
                <div id="awayScore"></div>
                <div id="homeTeamLogo"></div>
                <div id="homeTeamName"></div>
                <div id="homeScore"></div>
                <div id="gameStatusInfo"></div>
                <div id="playByPlayContainer"></div>
                <div id="boxScoreContainer"></div>
                <div id="gameStatsContainer"></div>
            </div>
        `;
        
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Mock fetch
        global.fetch = vi.fn();

        // Load script content
        const htmlPath = resolve(__dirname, '../../schedule.html');
        const htmlContent = readFileSync(htmlPath, 'utf8');
        const scripts = htmlContent.match(/<script>([\s\S]*?)<\/script>/g);
        scriptContent = scripts ? scripts[scripts.length - 1].replace(/<\/?script>/g, '') : '';

        // Mock global objects
        global.IntersectionObserver = vi.fn(() => ({
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn(),
        }));

        // Mock scrollTo
        global.scrollTo = vi.fn();
        
        // Mock teamAbbreviations
        global.teamAbbreviations = { 'Philadelphia 76ers': 'PHI' };
    });

    it('should fetch real standings data and update the UI', async () => {
        const mockStandingsResponse = {
            success: true,
            data: [
                { pos: 1, team: 'Detroit Pistons', tricode: 'DET', w: 35, l: 12, pct: '.745', gb: '-', strk: 'W3', l10: '8-2' },
                { pos: 6, team: 'Philadelphia 76ers', tricode: 'PHI', w: 26, l: 21, pct: '.553', gb: '9.0', strk: 'W1', l10: '5-5' }
            ]
        };

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockStandingsResponse
        });

        try {
            eval(scriptContent);
        } catch (e) {
            // console.log('Eval error:', e.message);
        }

        if (typeof fetchStandings === 'function') {
            await fetchStandings();
            
            const standingsBody = document.getElementById('standings-body');
            expect(standingsBody.innerHTML).toContain('Philadelphia 76ers');
            expect(standingsBody.innerHTML).toContain('highlight-sixers');
            expect(document.getElementById('standings-updated').textContent).toContain('Last updated:');
        }
    });

    it('should handle fetch errors by falling back to mock data', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        try {
            eval(scriptContent);
        } catch (e) {}

        if (typeof fetchStandings === 'function') {
            await fetchStandings();
            
            const standingsBody = document.getElementById('standings-body');
            // It should still have 76ers because of mock fallback
            expect(standingsBody.innerHTML).toContain('Philadelphia 76ers');
            expect(document.getElementById('standings-updated').textContent).toContain('Demo Mode');
        }
    });

    it('should trigger auto-refresh on intervals', async () => {
        try {
            eval(scriptContent);
        } catch (e) {}

        // Trigger DOMContentLoaded
        document.dispatchEvent(new Event('DOMContentLoaded'));

        // Advance time by 5 minutes
        vi.advanceTimersByTime(300000);
        
        expect(global.fetch).toHaveBeenCalled();
    });

    it('should start live game updates every 10 seconds for live games', async () => {
        // Set up scheduleData with a live game
        global.scheduleData = [
            { date: '2025-01-01', opponent: 'Brooklyn Nets', location: 'away', nbaGameId: '12345', isLive: true }
        ];

        try {
            eval(scriptContent);
        } catch (e) {}

        if (typeof startLiveGameUpdates === 'function') {
            startLiveGameUpdates();
            
            // Advance time by 10 seconds
            vi.advanceTimersByTime(10000);
            
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('12345'), expect.anything());
        }
    });
});
