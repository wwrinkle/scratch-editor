// Events that count as a user gesture, which iOS requires before audio can resume.
const GESTURE_EVENTS = ['touchend', 'mouseup', 'keydown'];

/**
 * Resume an AudioContext whenever the browser pauses it.
 *
 * iOS Safari suspends or interrupts audio when the screen locks, the user switches apps, the
 * microphone is used, and so on, and never resumes it on its own. This retries on every user
 * gesture, when the page becomes visible, and whenever the context's state changes.
 * @param {AudioContext} audioContext - the context to keep running
 * @returns {() => void} call to stop watching the context
 */
const keepAudioContextRunning = audioContext => {
    const isPaused = () => audioContext.state !== 'running' && audioContext.state !== 'closed';

    const resumeIfPaused = () => {
        if (!isPaused()) return;
        const state = audioContext.state;
        audioContext.resume().catch(e => {
            // eslint-disable-next-line no-console
            console.warn('keepAudioContextRunning: failed to resume audio context in state', state, e);
        });
    };

    const handleGesture = () => {
        if (!isPaused()) return;
        // iOS only unlocks audio output if a sound is started during the gesture itself.
        const source = audioContext.createBufferSource();
        source.buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
        source.connect(audioContext.destination);
        source.start(0);
        resumeIfPaused();
    };

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') resumeIfPaused();
    };

    // Capture phase, so the editor's own handlers can't stop the event from reaching us.
    GESTURE_EVENTS.forEach(type => document.addEventListener(type, handleGesture, true));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    audioContext.addEventListener('statechange', resumeIfPaused);

    return () => {
        GESTURE_EVENTS.forEach(type => document.removeEventListener(type, handleGesture, true));
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        audioContext.removeEventListener('statechange', resumeIfPaused);
    };
};

export default keepAudioContextRunning;
