/**
 * UI Sound Utilities
 * Uses Web Audio API to synthesize premium, high-volume notification sounds.
 * This approach is 100% reliable across browsers and avoids Base64 corruption issues.
 */

let audioCtx = null;

/**
 * Initialize Audio Context on demand
 */
const getAudioCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
};

/**
 * Synthesize a clean tone
 * @param {number} freq - Frequency in Hz
 * @param {number} startTime - Start time relative to context
 * @param {number} duration - Duration in seconds
 * @param {number} volume - Volume (0 to 1)
 */
const playTone = (freq, startTime, duration, volume = 0.5) => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
};

/**
 * Play a synthesized sound alert
 * @param {('MESSAGE'|'NOTIFICATION')} soundKey 
 */
export const playSound = (soundKey) => {
    try {
        const ctx = getAudioCtx();

        // Browsers require a user interaction to start the AudioContext
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;

        if (soundKey === 'NOTIFICATION') {
            // Premium iPhone-style "Tri-tone" (Higher volume for the user)
            // Sequence: C6, E6, G6
            playTone(1046.50, now, 0.15, 0.8);        // C6
            playTone(1318.51, now + 0.12, 0.15, 0.8); // E6
            playTone(1567.98, now + 0.24, 0.3, 0.8);  // G6
            console.log("[soundUtils] Synthesized Notification Chime played at 80% volume.");
        } else if (soundKey === 'MESSAGE') {
            // Clean "pop" sound
            playTone(880, now, 0.1, 0.5); // A5
        }
    } catch (error) {
        console.error("[soundUtils] Synthesis failed:", error);
    }
};
