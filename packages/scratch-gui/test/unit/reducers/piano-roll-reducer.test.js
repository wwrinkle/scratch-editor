/* eslint-env jest */
import pianoRollReducer, {
    addPianoRollNote,
    showPianoRoll,
    hidePianoRoll,
    togglePianoRoll
} from '../../../src/reducers/piano-roll';

test('initialState', () => {
    let defaultState;
    /* pianoRollReducer(state, action) */
    expect(pianoRollReducer(defaultState, {type: 'anything'})).toBeDefined();
});

test('showPianoRoll makes the panel visible without touching notes', () => {
    const previousState = {visible: false, notes: [{type: 'note', note: 60, timestamp: 0}]};
    const newState = pianoRollReducer(previousState, showPianoRoll());
    expect(newState.visible).toBe(true);
    expect(newState.notes).toBe(previousState.notes);
});

test('hidePianoRoll hides the panel and clears notes', () => {
    const previousState = {visible: true, notes: [{type: 'note', note: 60, timestamp: 0}]};
    const newState = pianoRollReducer(previousState, hidePianoRoll());
    expect(newState.visible).toBe(false);
    expect(newState.notes).toEqual([]);
});

test('togglePianoRoll flips visibility without touching notes', () => {
    const notes = [{type: 'note', note: 60, timestamp: 0}];
    const shown = pianoRollReducer({visible: false, notes}, togglePianoRoll());
    expect(shown.visible).toBe(true);
    expect(shown.notes).toBe(notes);

    const hidden = pianoRollReducer({visible: true, notes}, togglePianoRoll());
    expect(hidden.visible).toBe(false);
    expect(hidden.notes).toBe(notes);
});

test('drops notes that are much older than the newest note, instead of leaving a gap', () => {
    const previousState = {
        visible: true,
        notes: [
            {type: 'note', note: 60, duration: 0.25, timestamp: 0, displayName: 'C4', color: '#fff'}
        ]
    };
    // A note played long after the previous one (e.g. after a rest block) should evict
    // the stale note rather than stretching the timeline across the gap between them.
    const action = addPianoRollNote({
        type: 'note',
        note: 62,
        duration: 0.25,
        timestamp: 60000,
        displayName: 'D4',
        color: '#fff'
    });
    const newState = pianoRollReducer(previousState, action);
    expect(newState.notes).toHaveLength(1);
    expect(newState.notes[0].timestamp).toBe(60000);
});

test('keeps notes that are recent relative to the newest note', () => {
    const previousState = {
        visible: true,
        notes: [
            {type: 'note', note: 60, duration: 0.25, timestamp: 0, displayName: 'C4', color: '#fff'}
        ]
    };
    const action = addPianoRollNote({
        type: 'note',
        note: 62,
        duration: 0.25,
        timestamp: 500,
        displayName: 'D4',
        color: '#fff'
    });
    const newState = pianoRollReducer(previousState, action);
    expect(newState.notes).toHaveLength(2);
});

test('caps stored notes at 100, dropping the oldest first', () => {
    const notes = [];
    for (let i = 0; i < 100; i++) {
        notes.push({type: 'note', note: 60, duration: 0.25, timestamp: i, displayName: 'C4', color: '#fff'});
    }
    const previousState = {visible: true, notes};
    const action = addPianoRollNote({
        type: 'note', note: 62, duration: 0.25, timestamp: 100, displayName: 'D4', color: '#fff'
    });
    const newState = pianoRollReducer(previousState, action);
    expect(newState.notes).toHaveLength(100);
    expect(newState.notes[0].timestamp).toBe(1);
    expect(newState.notes[99].timestamp).toBe(100);
});
