import React from 'react';
import {fireEvent} from '@testing-library/react';
import '@testing-library/jest-dom';
import {renderWithIntl} from '../../helpers/intl-helpers.jsx';
import PianoRollComponent from '../../../src/components/piano-roll/piano-roll';

describe('PianoRoll component', () => {
    const defaultProps = () => ({
        notes: [],
        onClosePianoRoll: jest.fn(),
        visible: true
    });

    test('renders nothing when not visible', () => {
        const {container} = renderWithIntl(<PianoRollComponent
            {...defaultProps()}
            visible={false}
        />);
        expect(container.firstChild).toBeNull();
    });

    test('shows a placeholder when visible with no notes', () => {
        const {container} = renderWithIntl(<PianoRollComponent {...defaultProps()} />);
        expect(container).toHaveTextContent('Piano roll preview will appear here when music is playing.');
        expect(container.querySelectorAll('div[title]')).toHaveLength(0);
    });

    test('clicking the close button calls onClosePianoRoll', () => {
        const props = defaultProps();
        const {container} = renderWithIntl(<PianoRollComponent {...props} />);
        fireEvent.click(container.querySelector('button'));
        expect(props.onClosePianoRoll).toHaveBeenCalled();
    });

    test('notes played at the same timestamp line up at the same horizontal position', () => {
        const notes = [
            {color: '#fff', displayName: 'C4', duration: 0.25, note: 60, timestamp: 1000, type: 'note'},
            {color: '#fff', displayName: 'E4', duration: 0.25, note: 64, timestamp: 1000, type: 'note'}
        ];
        const {container} = renderWithIntl(<PianoRollComponent
            {...defaultProps()}
            notes={notes}
        />);
        const bars = container.querySelectorAll('div[title]');
        expect(bars).toHaveLength(2);
        expect(bars[0].style.left).toBe(bars[1].style.left);
    });

    test('higher-pitched notes are laid out above lower-pitched notes', () => {
        const notes = [
            {color: '#fff', displayName: 'C4', duration: 0.25, note: 60, timestamp: 0, type: 'note'},
            {color: '#fff', displayName: 'C5', duration: 0.25, note: 72, timestamp: 0, type: 'note'}
        ];
        const {container} = renderWithIntl(<PianoRollComponent
            {...defaultProps()}
            notes={notes}
        />);
        const lowBar = [...container.querySelectorAll('div[title]')].find(el => el.title.startsWith('C4'));
        const highBar = [...container.querySelectorAll('div[title]')].find(el => el.title.startsWith('C5'));
        expect(parseFloat(highBar.style.top)).toBeLessThan(parseFloat(lowBar.style.top));
    });

    test('always renders at least one octave of pitch rows, even for a single repeated note', () => {
        const notes = [
            {color: '#fff', displayName: 'C4', duration: 0.25, note: 60, timestamp: 0, type: 'note'},
            {color: '#fff', displayName: 'C4', duration: 0.25, note: 60, timestamp: 500, type: 'note'},
            {color: '#fff', displayName: 'C4', duration: 0.25, note: 60, timestamp: 1000, type: 'note'}
        ];
        const {container} = renderWithIntl(<PianoRollComponent
            {...defaultProps()}
            notes={notes}
        />);
        // Pitch rows are 14px tall and rendered twice per row (once in the gutter, once as
        // track background shading); note bars are a different height, so this isolates them.
        const rowHeightDivs = [...container.querySelectorAll('div')].filter(el => el.style.height === '14px');
        const pitchRowCount = rowHeightDivs.length / 2;
        expect(pitchRowCount).toBeGreaterThanOrEqual(13); // 12 semitones + 1: a full octave, inclusive
    });

    test('drum hits render in their own lane, labeled, without a pitch label', () => {
        const notes = [
            {color: '#f29f5a', displayName: 'Kick Drum', drumNum: 0, duration: 0.25, timestamp: 0, type: 'drum'}
        ];
        const {container} = renderWithIntl(<PianoRollComponent
            {...defaultProps()}
            notes={notes}
        />);
        expect(container.querySelector('span[title="Kick Drum"]')).toBeInTheDocument();
        const bar = container.querySelector('div[title^="Kick Drum"]');
        expect(bar).toBeInTheDocument();
        expect(bar).toHaveTextContent('');
    });

    test('zooms out so a very long note does not overflow the max track width', () => {
        const notes = [
            {color: '#fff', displayName: 'C4', duration: 1000, note: 60, timestamp: 0, type: 'note'}
        ];
        const {container} = renderWithIntl(<PianoRollComponent
            {...defaultProps()}
            notes={notes}
        />);
        const bar = container.querySelector('div[title]');
        expect(bar.style.width).toBe('2000px');
    });

    test('short notes use the normal per-second scale instead of the zoomed-out one', () => {
        const notes = [
            {color: '#fff', displayName: 'C4', duration: 0.5, note: 60, timestamp: 0, type: 'note'}
        ];
        const {container} = renderWithIntl(<PianoRollComponent
            {...defaultProps()}
            notes={notes}
        />);
        const bar = container.querySelector('div[title]');
        expect(bar.style.width).toBe('45px');
    });
});
