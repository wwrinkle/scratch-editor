import keepAudioContextRunning from '../../../src/lib/audio/keep-audio-context-running';

const createFakeAudioContext = state => {
    const context = new EventTarget();
    context.state = state;
    context.sampleRate = 44100;
    context.destination = {};
    context.resume = jest.fn(() => {
        context.state = 'running';
        return Promise.resolve();
    });
    context.createBuffer = jest.fn(() => ({}));
    context.createBufferSource = jest.fn(() => ({
        connect: jest.fn(),
        start: jest.fn()
    }));
    return context;
};

const setVisibilityState = visibilityState => {
    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => visibilityState
    });
};

describe('keepAudioContextRunning', () => {
    let stop;

    afterEach(() => {
        if (stop) stop();
        stop = null;
        setVisibilityState('visible');
    });

    test.each(['touchend', 'mouseup', 'keydown'])('resumes a suspended context on %s', eventType => {
        const context = createFakeAudioContext('suspended');
        stop = keepAudioContextRunning(context);

        document.body.dispatchEvent(new Event(eventType, {bubbles: true}));

        expect(context.resume).toHaveBeenCalledTimes(1);
        // iOS also needs a sound started during the gesture to unlock audio output
        expect(context.createBufferSource).toHaveBeenCalledTimes(1);
    });

    test('resumes an interrupted context on a tap', () => {
        const context = createFakeAudioContext('interrupted');
        stop = keepAudioContextRunning(context);

        document.body.dispatchEvent(new Event('touchend', {bubbles: true}));

        expect(context.resume).toHaveBeenCalledTimes(1);
    });

    test('resumes even when the tap target stops propagation', () => {
        const context = createFakeAudioContext('suspended');
        stop = keepAudioContextRunning(context);
        const target = document.createElement('div');
        document.body.appendChild(target);
        target.addEventListener('touchend', e => e.stopPropagation());

        target.dispatchEvent(new Event('touchend', {bubbles: true}));

        expect(context.resume).toHaveBeenCalledTimes(1);
        target.remove();
    });

    test('keeps working after the context has been running and is suspended again', () => {
        const context = createFakeAudioContext('suspended');
        stop = keepAudioContextRunning(context);

        document.body.dispatchEvent(new Event('touchend', {bubbles: true}));
        expect(context.state).toBe('running');

        context.state = 'suspended';
        document.body.dispatchEvent(new Event('touchend', {bubbles: true}));

        expect(context.resume).toHaveBeenCalledTimes(2);
    });

    test('does nothing on a tap while the context is running', () => {
        const context = createFakeAudioContext('running');
        stop = keepAudioContextRunning(context);

        document.body.dispatchEvent(new Event('touchend', {bubbles: true}));

        expect(context.resume).not.toHaveBeenCalled();
        expect(context.createBufferSource).not.toHaveBeenCalled();
    });

    test('does nothing to a closed context', () => {
        const context = createFakeAudioContext('closed');
        stop = keepAudioContextRunning(context);

        document.body.dispatchEvent(new Event('touchend', {bubbles: true}));

        expect(context.resume).not.toHaveBeenCalled();
    });

    test('resumes when the page becomes visible again', () => {
        const context = createFakeAudioContext('suspended');
        stop = keepAudioContextRunning(context);

        setVisibilityState('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
        expect(context.resume).not.toHaveBeenCalled();

        setVisibilityState('visible');
        document.dispatchEvent(new Event('visibilitychange'));
        expect(context.resume).toHaveBeenCalledTimes(1);
    });

    test('tries to resume when the context leaves the running state', () => {
        const context = createFakeAudioContext('running');
        stop = keepAudioContextRunning(context);

        context.state = 'interrupted';
        context.dispatchEvent(new Event('statechange'));

        expect(context.resume).toHaveBeenCalledTimes(1);
    });

    test('warns when resuming fails', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const context = createFakeAudioContext('suspended');
        const error = new Error('NotAllowedError');
        context.resume = jest.fn(() => Promise.reject(error));
        stop = keepAudioContextRunning(context);

        context.dispatchEvent(new Event('statechange'));
        await Promise.resolve();

        expect(warn).toHaveBeenCalledWith(expect.stringContaining('keepAudioContextRunning'), 'suspended', error);
        warn.mockRestore();
    });

    test('stops listening after the returned function is called', () => {
        const context = createFakeAudioContext('suspended');
        keepAudioContextRunning(context)();

        document.body.dispatchEvent(new Event('touchend', {bubbles: true}));
        document.dispatchEvent(new Event('visibilitychange'));
        context.dispatchEvent(new Event('statechange'));

        expect(context.resume).not.toHaveBeenCalled();
    });
});
