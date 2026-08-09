import {connect} from 'react-redux';
import {hidePianoRoll} from '../reducers/piano-roll';
import PianoRollComponent from '../components/piano-roll/piano-roll.jsx';

const mapStateToProps = state => ({
    visible: state.scratchGui.pianoRoll.visible,
    notes: state.scratchGui.pianoRoll.notes
});

const mapDispatchToProps = dispatch => ({
    onClosePianoRoll: () => dispatch(hidePianoRoll())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(PianoRollComponent);
