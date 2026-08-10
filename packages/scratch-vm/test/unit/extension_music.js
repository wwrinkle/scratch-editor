const test = require('tap').test;
const Music = require('../../src/extensions/scratch3_music/index.js');

const fakeRuntime = {
    getTargetForStage: () => ({tempo: 60}),
    on: () => {}, // Stub out listener methods used in constructor.
    emit: () => {}
};

const blocks = new Music(fakeRuntime);

const util = {
    stackFrame: Object.create(null),
    target: {
        audioPlayer: null
    },
    yield: () => null
};

// Minimal fakes for the Web Audio objects touched by _playDrumNum/_playNote, just
// enough for those methods to run to completion without a real AudioContext.
const fakeGainNode = () => ({
    gain: {
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {}
    },
    connect: () => {}
});

const fakeAudioEngine = () => ({
    audioContext: {
        createGain: fakeGainNode,
        currentTime: 0
    },
    currentTime: 0,
    getInputNode: () => ({})
});

const fakePlayer = () => ({
    isPlaying: false,
    isStarting: false,
    take: () => {},
    once: () => {},
    play: () => {},
    connect: () => {},
    outputNode: {
        playbackRate: {value: 0},
        stop: () => {}
    }
});

test('playDrum uses 1-indexing and wrap clamps', t => {
    // Stub playDrumNum
    let playedDrum;
    blocks._playDrumNum = (_util, drum) => (playedDrum = drum);

    let args = {DRUM: 1};
    blocks.playDrumForBeats(args, util);
    t.equal(playedDrum, 0);

    args = {DRUM: blocks.DRUM_INFO.length + 1};
    blocks.playDrumForBeats(args, util);
    t.equal(playedDrum, 0);

    t.end();
});

test('setInstrument uses 1-indexing and wrap clamps', t => {
    // Stub getMusicState
    const state = {currentInstrument: 0};
    blocks._getMusicState = () => state;

    let args = {INSTRUMENT: 1};
    blocks.setInstrument(args, util);
    t.equal(state.currentInstrument, 0);

    args = {INSTRUMENT: blocks.INSTRUMENT_INFO.length + 1};
    blocks.setInstrument(args, util);
    t.equal(state.currentInstrument, 0);

    t.end();
});

test('_getMidiNoteName converts MIDI note numbers to pitch + octave', t => {
    t.equal(blocks._getMidiNoteName(60), 'C4');
    t.equal(blocks._getMidiNoteName(61), 'C#4');
    t.equal(blocks._getMidiNoteName(69), 'A4');
    t.equal(blocks._getMidiNoteName(0), 'C-1');

    t.end();
});

test('_playDrumNum emits a MUSIC_NOTE_PLAYED event for the piano roll', t => {
    // Use a fresh instance: the "playDrum uses 1-indexing" test above permanently
    // stubs out the shared blocks._playDrumNum, so it can't be reused here to
    // exercise the real implementation.
    const drumBlocks = new Music(fakeRuntime);
    const emitted = [];
    fakeRuntime.emit = (event, data) => emitted.push({event, data});
    drumBlocks._drumPlayers = [fakePlayer()];

    const drumUtil = {
        runtime: {audioEngine: fakeAudioEngine()},
        target: {sprite: {soundBank: {}}, volume: 100}
    };
    drumBlocks._playDrumNum(drumUtil, 0);

    t.equal(emitted.length, 1);
    t.equal(emitted[0].event, 'MUSIC_NOTE_PLAYED');
    t.match(emitted[0].data, {
        type: 'drum',
        drumNum: 0,
        instrument: 0,
        duration: 0.25,
        displayName: drumBlocks.DRUM_INFO[0].name
    });
    t.type(emitted[0].data.timestamp, 'number');

    t.end();
});

test('_playNote emits a MUSIC_NOTE_PLAYED event for the piano roll', t => {
    const emitted = [];
    fakeRuntime.emit = (event, data) => emitted.push({event, data});
    blocks._getMusicState = () => ({currentInstrument: 0});

    const sampleArray = blocks.INSTRUMENT_INFO[0].samples;
    blocks._instrumentPlayerArrays[0] = sampleArray.map(() => ({}));
    blocks._instrumentPlayerNoteArrays[0] = [];
    blocks._instrumentPlayerNoteArrays[0][60] = fakePlayer();

    const noteUtil = {
        runtime: {audioEngine: fakeAudioEngine()},
        target: {sprite: {soundBank: {}}, volume: 100}
    };
    blocks._playNote(noteUtil, 60, 0.25);

    t.equal(emitted.length, 1);
    t.equal(emitted[0].event, 'MUSIC_NOTE_PLAYED');
    t.match(emitted[0].data, {
        type: 'note',
        note: 60,
        instrument: 0,
        duration: 0.25,
        displayName: 'C4'
    });
    t.type(emitted[0].data.color, 'string');
    t.type(emitted[0].data.timestamp, 'number');

    t.end();
});
