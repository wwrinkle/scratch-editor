import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from '@scratch/scratch-vm';
import {STAGE_SIZE_MODES} from '../lib/layout-constants';
import {setStageSize} from '../reducers/stage-size';
import {setFullScreen} from '../reducers/mode';
import {togglePianoRoll} from '../reducers/piano-roll';

import {connect} from 'react-redux';

import StageHeaderComponent from '../components/stage-header/stage-header.jsx';
import {showAlertWithTimeout, showStandardAlert} from '../reducers/alerts.js';

const ALERT_ID = {
    settingThumbnail: 'settingThumbnail',
    thumbnailSuccess: 'thumbnailSuccess',
    thumbnailError: 'thumbnailError'
};
 
class StageHeader extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleKeyPress',
            'handleExtensionAdded'
        ]);
        this.state = {
            isMusicExtensionLoaded: props.vm && props.vm.extensionManager &&
                typeof props.vm.extensionManager.isExtensionLoaded === 'function' &&
                props.vm.extensionManager.isExtensionLoaded('music')
        };
    }
    componentDidMount () {
        document.addEventListener('keydown', this.handleKeyPress);
        if (this.props.vm && typeof this.props.vm.on === 'function') {
            this.props.vm.on('EXTENSION_ADDED', this.handleExtensionAdded);
        }
    }
    componentDidUpdate (prevProps) {
        if (this.props.vm !== prevProps.vm) {
            if (prevProps.vm && typeof prevProps.vm.removeListener === 'function') {
                prevProps.vm.removeListener('EXTENSION_ADDED', this.handleExtensionAdded);
            }
            if (this.props.vm && typeof this.props.vm.on === 'function') {
                this.props.vm.on('EXTENSION_ADDED', this.handleExtensionAdded);
            }
            const isMusicExtensionLoaded = this.props.vm && this.props.vm.extensionManager &&
                typeof this.props.vm.extensionManager.isExtensionLoaded === 'function' &&
                this.props.vm.extensionManager.isExtensionLoaded('music');
            if (isMusicExtensionLoaded && !this.state.isMusicExtensionLoaded) {
                this.setState({isMusicExtensionLoaded});
            }
        }
    }
    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyPress);
        if (this.props.vm && typeof this.props.vm.removeListener === 'function') {
            this.props.vm.removeListener('EXTENSION_ADDED', this.handleExtensionAdded);
        }
    }
    handleExtensionAdded (categoryInfo) {
        if (categoryInfo && categoryInfo.id === 'music') {
            this.setState({isMusicExtensionLoaded: true});
        }
    }
    handleKeyPress (event) {
        if (event.key === 'Escape' && this.props.isFullScreen) {
            this.props.onSetStageUnFull(false);
        }
    }
    render () {
        const {
            ...props
        } = this.props;
        return (
            <StageHeaderComponent
                {...props}
                onKeyPress={this.handleKeyPress}
                pianoRollAvailable={this.state.isMusicExtensionLoaded}
            />
        );
    }
}

StageHeader.propTypes = {
    isFullScreen: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    onSetStageUnFull: PropTypes.func.isRequired,
    showBranding: PropTypes.bool,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = state => {
    const projectState = state.scratchGui.projectState;

    return {
        stageSizeMode: state.scratchGui.stageSize.stageSize,
        showBranding: state.scratchGui.mode.showBranding,
        isFullScreen: state.scratchGui.mode.isFullScreen,
        isPlayerOnly: state.scratchGui.mode.isPlayerOnly,

        projectId: projectState.projectId
    };

};

const mapDispatchToProps = dispatch => ({
    onSetStageLarge: () => dispatch(setStageSize(STAGE_SIZE_MODES.large)),
    onSetStageSmall: () => dispatch(setStageSize(STAGE_SIZE_MODES.small)),
    onSetStageFull: () => dispatch(setFullScreen(true)),
    onSetStageUnFull: () => dispatch(setFullScreen(false)),
    onShowSettingThumbnail: () => dispatch(showStandardAlert(ALERT_ID.settingThumbnail)),
    onShowThumbnailSuccess: () => showAlertWithTimeout(dispatch, ALERT_ID.thumbnailSuccess),
    onShowThumbnailError: () => showAlertWithTimeout(dispatch, ALERT_ID.thumbnailError),
    onTogglePianoRoll: () => dispatch(togglePianoRoll())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(StageHeader);
