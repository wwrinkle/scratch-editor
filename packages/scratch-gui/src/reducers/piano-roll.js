const SHOW_PIANO_ROLL = 'scratch-gui/piano-roll/SHOW_PIANO_ROLL';
const HIDE_PIANO_ROLL = 'scratch-gui/piano-roll/HIDE_PIANO_ROLL';
const TOGGLE_PIANO_ROLL = 'scratch-gui/piano-roll/TOGGLE_PIANO_ROLL';
const ADD_PIANO_ROLL_NOTE = 'scratch-gui/piano-roll/ADD_PIANO_ROLL_NOTE';

// Notes older than this, relative to the newest note, are evicted on arrival. Without this,
// a rest between phrases would keep old notes around, stretching the piano roll's timeline
// across the gap and leaving a big blank space between the old and new notes.
const MAX_NOTE_AGE_MS = 8000;
// Hard cap on stored notes, independent of age, so a rapid burst within the age window
// (e.g. a drum roll) can't grow the list without bound.
const MAX_NOTE_COUNT = 100;

const initialState = {
    visible: false,
    notes: []
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SHOW_PIANO_ROLL:
        return Object.assign({}, state, {
            visible: true
        });
    case HIDE_PIANO_ROLL:
        return Object.assign({}, state, {
            visible: false,
            notes: []
        });
    case TOGGLE_PIANO_ROLL:
        return Object.assign({}, state, {
            visible: !state.visible
        });
    case ADD_PIANO_ROLL_NOTE: {
        const recentNotes = state.notes.filter(
            note => (action.note.timestamp - note.timestamp) <= MAX_NOTE_AGE_MS
        );
        return Object.assign({}, state, {
            notes: recentNotes.concat(action.note).slice(-MAX_NOTE_COUNT)
        });
    }
    default:
        return state;
    }
};

const showPianoRoll = function () {
    return {
        type: SHOW_PIANO_ROLL
    };
};

const hidePianoRoll = function () {
    return {
        type: HIDE_PIANO_ROLL
    };
};

const togglePianoRoll = function () {
    return {
        type: TOGGLE_PIANO_ROLL
    };
};

const addPianoRollNote = function (note) {
    return {
        type: ADD_PIANO_ROLL_NOTE,
        note
    };
};

export {
    reducer as default,
    initialState as pianoRollInitialState,
    showPianoRoll,
    hidePianoRoll,
    togglePianoRoll,
    addPianoRollNote
};
