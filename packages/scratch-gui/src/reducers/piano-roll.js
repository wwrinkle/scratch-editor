const SHOW_PIANO_ROLL = 'scratch-gui/piano-roll/SHOW_PIANO_ROLL';
const HIDE_PIANO_ROLL = 'scratch-gui/piano-roll/HIDE_PIANO_ROLL';
const TOGGLE_PIANO_ROLL = 'scratch-gui/piano-roll/TOGGLE_PIANO_ROLL';
const ADD_PIANO_ROLL_NOTE = 'scratch-gui/piano-roll/ADD_PIANO_ROLL_NOTE';

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
    case ADD_PIANO_ROLL_NOTE:
        return Object.assign({}, state, {
            notes: state.notes.concat(action.note).slice(-20)
        });
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
