import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useRef} from 'react';
import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import styles from './piano-roll.css';

const messages = {
    pianoRollTitle: {
        defaultMessage: 'Piano Roll',
        description: 'Heading for the piano roll panel',
        id: 'gui.pianoRoll.title'
    },
    pianoRollPlaceholder: {
        defaultMessage: 'Piano roll preview will appear here when music is playing.',
        description: 'Placeholder text for the piano roll panel before the piano roll is rendered',
        id: 'gui.pianoRoll.placeholder'
    },
    closeButton: {
        defaultMessage: 'Close',
        description: 'Button text to close the piano roll panel',
        id: 'gui.pianoRoll.closeButton'
    }
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_KEY_OFFSETS = [1, 3, 6, 8, 10];

const ROW_HEIGHT = 14; // px per semitone/drum lane row
const PX_PER_SECOND = 90; // horizontal time scale at 1x zoom
const MAX_TRACK_WIDTH = 2000; // cap on track width in px; slow tempos zoom out to fit under this
const MIN_DURATION_SEC = 0.12; // floor so very short notes stay visible
const PITCH_PADDING = 2; // extra semitone rows above/below the played range
const MIN_OCTAVE_SPAN = 12; // semitones in an octave; always shown so a single repeated
// note (or a narrow-range passage) still has a landmark to orient by, instead of a
// pitch axis that's collapsed down to just a couple of rows
// Re-anchor the timeline origin once it's been open this long without ever fully going
// quiet (see the origin-freezing comment below). Comfortably under MAX_TRACK_WIDTH /
// PX_PER_SECOND (~22s), so this fires before zoom-out ever would, keeping the common
// case pinned at 1x scale instead of slowly compressing over a long/repeated session.
const ORIGIN_RESET_SEC = 15;

const midiNoteName = note => {
    const octave = Math.floor(note / 12) - 1;
    const pitch = NOTE_NAMES[((note % 12) + 12) % 12];
    return `${pitch}${octave}`;
};

const isBlackKey = note => BLACK_KEY_OFFSETS.includes(((note % 12) + 12) % 12);

// Lay the note/drum events out left-to-right by their real playback timestamp (so notes
// played at the same time, e.g. a chord split across scripts, line up vertically instead
// of appearing arpeggiated), and map pitches to row indices for a 2D piano-roll-style
// graph (similar in spirit to Strudel's .pianoroll()).
//
// baseTimestamp is passed in rather than derived from `notes` here: the reducer trims
// old notes off the front of the array independently of what's currently on screen, and
// deriving the origin from whichever note happens to be oldest right now would shift
// every already-drawn note sideways each time that trim point changes.
const layoutNotes = (notes, baseTimestamp) => {
    const pitches = notes
        .filter(note => note.type !== 'drum' && typeof note.note === 'number')
        .map(note => note.note);

    let minPitch = (pitches.length ? Math.min(...pitches) : 60) - PITCH_PADDING;
    let maxPitch = (pitches.length ? Math.max(...pitches) : 72) + PITCH_PADDING;
    const spanDeficit = MIN_OCTAVE_SPAN - (maxPitch - minPitch);
    if (spanDeficit > 0) {
        const extraBelow = Math.floor(spanDeficit / 2);
        minPitch -= extraBelow;
        maxPitch += spanDeficit - extraBelow;
    }
    const pitchRowCount = (maxPitch - minPitch) + 1;

    const drumLanes = [];
    const drumLabels = {};
    notes.forEach(note => {
        if (note.type === 'drum') {
            if (!drumLanes.includes(note.drumNum)) drumLanes.push(note.drumNum);
            drumLabels[note.drumNum] = note.displayName;
        }
    });

    let totalDuration = MIN_DURATION_SEC;
    const items = notes.map((note, index) => {
        const duration = Math.max(note.duration || 0, MIN_DURATION_SEC);
        const start = (note.timestamp - baseTimestamp) / 1000;
        totalDuration = Math.max(totalDuration, start + duration);

        const rowIndex = note.type === 'drum' ?
            pitchRowCount + drumLanes.indexOf(note.drumNum) :
            maxPitch - note.note;

        return {
            key: `${note.type}-${note.note || note.drumNum}-${note.timestamp}-${index}`,
            label: note.displayName,
            color: note.color,
            isDrum: note.type === 'drum',
            start,
            duration,
            rowIndex
        };
    });

    return {
        items,
        minPitch,
        maxPitch,
        pitchRowCount,
        drumLanes,
        drumLabels,
        totalRows: pitchRowCount + drumLanes.length,
        totalDuration
    };
};

const PianoRollComponent = props => {
    const scrollRef = useRef(null);
    const notes = props.notes || [];

    // The timeline's origin and pixel scale are held here rather than derived fresh from
    // `notes` each render. The reducer trims old notes independently of what's on screen
    // (an age window, and a hard count cap that two simultaneous fast lines can reach
    // easily); recomputing the origin/scale from whatever survives that trim would shift
    // or rescale every already-drawn note on eviction instead of just adding a new one.
    // Both refs only ever move the timeline's near edge forward/out, matching a note
    // scrolling off the left edge rather than the whole graph jumping.
    //
    // The origin can't just stay frozen forever, though: notes carry wall-clock
    // timestamps (Date.now()), so if the panel never goes fully quiet (repeated test
    // runs, or one long play session) the elapsed time since a frozen origin grows
    // without bound, which would keep shrinking pxPerSecond and compress every note
    // into a sliver. ORIGIN_RESET_SEC re-anchors periodically to prevent that; it's a
    // deliberately rare, visible re-flow, far less disruptive than jittering per note.
    const baseTimestampRef = useRef(null);
    const maxTotalDurationRef = useRef(MIN_DURATION_SEC);
    if (notes.length === 0 || maxTotalDurationRef.current > ORIGIN_RESET_SEC) {
        baseTimestampRef.current = null;
        maxTotalDurationRef.current = MIN_DURATION_SEC;
    }
    if (notes.length > 0 && baseTimestampRef.current === null) {
        baseTimestampRef.current = Math.min(...notes.map(note => note.timestamp));
    }

    const layout = useMemo(
        () => layoutNotes(notes, baseTimestampRef.current || 0),
        [notes]
    );
    maxTotalDurationRef.current = Math.max(maxTotalDurationRef.current, layout.totalDuration);
    const totalDuration = maxTotalDurationRef.current;

    // Zoom out (fewer px/sec) once the ideal width would exceed the cap, so a slow
    // tempo or long held notes don't grow the track without bound.
    const pxPerSecond = Math.min(PX_PER_SECOND, MAX_TRACK_WIDTH / totalDuration);

    useEffect(() => {
        if (scrollRef.current) {
            // Scroll using the track's target width rather than the DOM's current
            // scrollWidth: the track animates width changes (see .pianoRollTrack), so
            // scrollWidth may still reflect the pre-transition value here. The browser
            // clamps this to the max valid scroll position either way.
            scrollRef.current.scrollLeft = totalDuration * pxPerSecond;
        }
    }, [notes, totalDuration, pxPerSecond]);

    if (!props.visible) return null;

    const trackHeight = layout.totalRows * ROW_HEIGHT;
    const trackWidth = Math.max(totalDuration * pxPerSecond, 1);

    const pitchRows = [];
    for (let row = 0; row < layout.pitchRowCount; row++) {
        const pitch = layout.maxPitch - row;
        pitchRows.push({
            key: `pitch-${pitch}`,
            top: row * ROW_HEIGHT,
            black: isBlackKey(pitch),
            label: pitch % 12 === 0 ? midiNoteName(pitch) : null
        });
    }

    const drumRows = layout.drumLanes.map((drumNum, index) => ({
        key: `drum-${drumNum}`,
        top: (layout.pitchRowCount + index) * ROW_HEIGHT,
        shaded: index % 2 === 1,
        label: layout.drumLabels[drumNum]
    }));

    return (
        <Box className={styles.pianoRollPanel}>
            <Box className={styles.pianoRollHeader}>
                <div className={styles.pianoRollTitle}>
                    <FormattedMessage {...messages.pianoRollTitle} />
                </div>
                <Button
                    className={styles.closeButton}
                    onClick={props.onClosePianoRoll}
                >
                    <FormattedMessage {...messages.closeButton} />
                </Button>
            </Box>
            <Box className={styles.pianoRollBody}>
                {notes.length === 0 ? (
                    <div className={styles.pianoRollPlaceholder}>
                        <FormattedMessage {...messages.pianoRollPlaceholder} />
                    </div>
                ) : (
                    <div
                        className={styles.pianoRollGraph}
                        ref={scrollRef}
                    >
                        <div
                            className={styles.pianoRollGutter}
                            style={{height: `${trackHeight}px`}}
                        >
                            {pitchRows.map(row => (
                                <div
                                    key={row.key}
                                    className={styles.pianoRollGutterRow}
                                    style={{top: `${row.top}px`, height: `${ROW_HEIGHT}px`}}
                                >
                                    <div className={styles.pianoRollKeyLane}>
                                        {row.black && <div className={styles.pianoRollKeyBlackCap} />}
                                    </div>
                                    {row.label && (
                                        <span className={styles.pianoRollGutterLabel}>{row.label}</span>
                                    )}
                                </div>
                            ))}
                            {drumRows.map(row => (
                                <div
                                    key={row.key}
                                    className={styles.pianoRollGutterRow}
                                    style={{top: `${row.top}px`, height: `${ROW_HEIGHT}px`}}
                                >
                                    <span
                                        className={styles.pianoRollGutterLabel}
                                        title={row.label}
                                    >
                                        {row.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div
                            className={styles.pianoRollTrack}
                            style={{
                                width: `${trackWidth}px`,
                                height: `${trackHeight}px`,
                                backgroundSize: `${pxPerSecond}px 100%`
                            }}
                        >
                            {pitchRows.map(row => (
                                <div
                                    key={row.key}
                                    className={row.black ?
                                        styles.pianoRollRowBlack :
                                        styles.pianoRollRowWhite}
                                    style={{top: `${row.top}px`, height: `${ROW_HEIGHT}px`}}
                                />
                            ))}
                            {drumRows.map(row => (
                                <div
                                    key={row.key}
                                    className={row.shaded ?
                                        styles.pianoRollRowBlack :
                                        styles.pianoRollRowWhite}
                                    style={{top: `${row.top}px`, height: `${ROW_HEIGHT}px`}}
                                />
                            ))}
                            {layout.pitchRowCount > 0 && (
                                <div
                                    className={styles.pianoRollLaneDivider}
                                    style={{top: `${layout.pitchRowCount * ROW_HEIGHT}px`}}
                                />
                            )}
                            {layout.items.map(item => (
                                <div
                                    key={item.key}
                                    className={styles.pianoRollNoteBar}
                                    title={`${item.label} (${item.duration.toFixed(2)}s)`}
                                    style={{
                                        left: `${item.start * pxPerSecond}px`,
                                        top: `${(item.rowIndex * ROW_HEIGHT) + 1}px`,
                                        width: `${Math.max(item.duration * pxPerSecond, 8)}px`,
                                        height: `${ROW_HEIGHT - 2}px`,
                                        backgroundColor: item.color
                                    }}
                                >
                                    {!item.isDrum && (
                                        <span className={styles.pianoRollNoteBarLabel}>{item.label}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Box>
        </Box>
    );
};

PianoRollComponent.propTypes = {
    notes: PropTypes.arrayOf(PropTypes.shape({
        color: PropTypes.string,
        displayName: PropTypes.string,
        drumNum: PropTypes.number,
        duration: PropTypes.number,
        note: PropTypes.number,
        timestamp: PropTypes.number,
        type: PropTypes.string
    })),
    onClosePianoRoll: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired
};

export default PianoRollComponent;
