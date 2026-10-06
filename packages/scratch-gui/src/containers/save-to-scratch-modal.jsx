import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import SaveToScratchModalComponent from '../components/save-to-scratch-modal/save-to-scratch-modal.jsx';
import {closeSaveToScratchModal} from '../reducers/modals';
import {getProjectFilename} from './sb3-downloader.jsx';
import {projectTitleInitialState} from '../reducers/project-title';

const SaveToScratchModal = ({visible, ...props}) => (
    visible ? <SaveToScratchModalComponent {...props} /> : null
);

SaveToScratchModal.propTypes = {
    visible: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl,
    projectFilename: getProjectFilename(state.scratchGui.projectTitle, projectTitleInitialState),
    visible: state.scratchGui.modals.saveToScratch
});

const mapDispatchToProps = dispatch => ({
    onRequestClose: () => dispatch(closeSaveToScratchModal())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SaveToScratchModal);
