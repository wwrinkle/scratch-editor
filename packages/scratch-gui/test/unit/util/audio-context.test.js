/* global WebAudioTestAPI */
import 'web-audio-test-api';
WebAudioTestAPI.setState({
    'AudioContext#resume': 'enabled'
});

import SharedAudioContext from '../../../src/lib/audio/shared-audio-context';
import keepAudioContextRunning from '../../../src/lib/audio/keep-audio-context-running';

jest.mock('../../../src/lib/audio/keep-audio-context-running', () => jest.fn());

describe('Shared Audio Context', () => {
    const audioContext = new AudioContext();

    test('returns empty object without user gesture', () => {
        const sharedAudioContext = new SharedAudioContext();
        expect(sharedAudioContext).toMatchObject({});
    });

    test('returns AudioContext when mousedown is triggered', () => {
        const sharedAudioContext1 = new SharedAudioContext();
        expect(sharedAudioContext1).toMatchObject({});

        const event = new Event('mousedown');
        document.dispatchEvent(event);

        const sharedAudioContext2 = new SharedAudioContext();
        expect(sharedAudioContext2).toMatchObject(audioContext);
    });

    test('returns AudioContext when touchstart is triggered', () => {
        const sharedAudioContext1 = new SharedAudioContext();
        expect(sharedAudioContext1).toMatchObject({});

        const event = new Event('touchstart');
        document.dispatchEvent(event);

        const sharedAudioContext2 = new SharedAudioContext();
        expect(sharedAudioContext2).toMatchObject(audioContext);
    });

    test('keeps the shared AudioContext running once it is created', () => {
        expect(keepAudioContextRunning).toHaveBeenCalledTimes(1);
        expect(keepAudioContextRunning).toHaveBeenCalledWith(new SharedAudioContext());
    });
});
