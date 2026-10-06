import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback, useState} from 'react';
import {defineMessages, FormattedMessage, useIntl} from 'react-intl';

import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import SB3Downloader from '../../containers/sb3-downloader.jsx';

import styles from './save-to-scratch-modal.css';

// Scratch has no third-party login or save API, so instead of saving directly we
// let the user download the .sb3 and walk them through loading it into their own account.
const SCRATCH_EDITOR_URL = 'https://scratch.mit.edu/projects/editor/';

const DOWNLOAD_IDLE = 'idle';
const DOWNLOAD_PREPARING = 'preparing';
const DOWNLOAD_DONE = 'done';

const messages = defineMessages({
    title: {
        defaultMessage: 'Save to your Scratch account',
        description: 'Title of the modal explaining how to move a downloaded project into a Scratch account',
        id: 'gui.saveToScratch.title'
    },
    download: {
        defaultMessage: 'Download project',
        description: 'Button that downloads the project file so it can be uploaded to Scratch',
        id: 'gui.saveToScratch.download'
    },
    preparing: {
        defaultMessage: 'Preparing…',
        description: 'Download button label while the project file is being created',
        id: 'gui.saveToScratch.preparing'
    },
    downloadAgain: {
        defaultMessage: 'Download again',
        description: 'Download button label after the project has already been downloaded once',
        id: 'gui.saveToScratch.downloadAgain'
    },
    loadMenuPath: {
        defaultMessage: 'File → Load from your computer',
        description: 'Menu path in the Scratch editor for loading a project file',
        id: 'gui.saveToScratch.loadMenuPath'
    },
    saveMenuPath: {
        defaultMessage: 'File → Save now',
        description: 'Menu path in the Scratch editor for saving a project',
        id: 'gui.saveToScratch.saveMenuPath'
    },
    openScratch: {
        defaultMessage: 'Open Scratch',
        description: 'Button that opens the Scratch editor in a new tab',
        id: 'gui.saveToScratch.openScratch'
    },
    done: {
        defaultMessage: 'Done',
        description: 'Button that closes the save-to-Scratch modal',
        id: 'gui.saveToScratch.done'
    }
});

const SaveToScratchModal = ({isRtl, onRequestClose, projectFilename}) => {
    const intl = useIntl();
    const [downloadState, setDownloadState] = useState(DOWNLOAD_IDLE);
    const handleSaveFinished = useCallback(() => setDownloadState(DOWNLOAD_DONE), []);
    const getDownloadHandler = downloadProjectCallback => () => {
        setDownloadState(DOWNLOAD_PREPARING);
        downloadProjectCallback();
    };

    let downloadLabel = messages.download;
    if (downloadState === DOWNLOAD_PREPARING) downloadLabel = messages.preparing;
    if (downloadState === DOWNLOAD_DONE) downloadLabel = messages.downloadAgain;

    return (
        <Modal
            className={styles.modalContent}
            contentLabel={intl.formatMessage(messages.title)}
            id="saveToScratchModal"
            isRtl={isRtl}
            onRequestClose={onRequestClose}
        >
            <Box className={styles.body}>
                <ol className={styles.steps}>
                    <li className={styles.step}>
                        <FormattedMessage
                            defaultMessage="Download your project to this computer."
                            description="Step 1: download the project file"
                            id="gui.saveToScratch.step1"
                        />
                        <Box className={styles.stepAction}>
                            <SB3Downloader onSaveFinished={handleSaveFinished}>
                                {(className, downloadProjectCallback) => (
                                    <button
                                        className={classNames(className, styles.button, {
                                            [styles.primaryButton]: downloadState !== DOWNLOAD_DONE
                                        })}
                                        disabled={downloadState === DOWNLOAD_PREPARING}
                                        onClick={getDownloadHandler(downloadProjectCallback)}
                                    >
                                        {intl.formatMessage(downloadLabel)}
                                    </button>
                                )}
                            </SB3Downloader>
                            {downloadState === DOWNLOAD_DONE && (
                                <span className={styles.status}>
                                    <FormattedMessage
                                        defaultMessage="✓ Saved as {filename} in your Downloads folder"
                                        description="Confirmation shown after the project file has been downloaded"
                                        id="gui.saveToScratch.downloaded"
                                        values={{
                                            filename: <strong>{projectFilename}</strong>
                                        }}
                                    />
                                </span>
                            )}
                        </Box>
                    </li>
                    <li className={styles.step}>
                        <FormattedMessage
                            defaultMessage="Open Scratch in a new tab and sign in to your account."
                            description="Step 2: open the Scratch editor and sign in"
                            id="gui.saveToScratch.step2"
                        />
                        <Box className={styles.stepAction}>
                            <a
                                className={classNames(styles.button, {
                                    [styles.primaryButton]: downloadState === DOWNLOAD_DONE
                                })}
                                href={SCRATCH_EDITOR_URL}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                {intl.formatMessage(messages.openScratch)}
                            </a>
                        </Box>
                    </li>
                    <li className={styles.step}>
                        <FormattedMessage
                            defaultMessage="In Scratch, choose {menuPath} and pick the file you downloaded."
                            description="Step 3: load the downloaded file into the Scratch editor"
                            id="gui.saveToScratch.step3"
                            values={{
                                menuPath: <strong>{intl.formatMessage(messages.loadMenuPath)}</strong>
                            }}
                        />
                    </li>
                    <li className={styles.step}>
                        <FormattedMessage
                            defaultMessage="Give your project a title, then choose {menuPath}. It will now be in My Stuff." // eslint-disable-line @stylistic/max-len
                            description="Step 4: save the project on Scratch so it appears in My Stuff"
                            id="gui.saveToScratch.step4"
                            values={{
                                menuPath: <strong>{intl.formatMessage(messages.saveMenuPath)}</strong>
                            }}
                        />
                    </li>
                </ol>
                <p className={styles.note}>
                    <FormattedMessage
                        defaultMessage="Your blocks and music will work on Scratch, but the piano roll only appears here." // eslint-disable-line @stylistic/max-len
                        description="Note that the piano roll panel is specific to this editor"
                        id="gui.saveToScratch.pianoRollNote"
                    />
                </p>
                <Box className={styles.buttonRow}>
                    <button
                        className={styles.button}
                        onClick={onRequestClose}
                    >
                        {intl.formatMessage(messages.done)}
                    </button>
                </Box>
            </Box>
        </Modal>
    );
};

SaveToScratchModal.propTypes = {
    isRtl: PropTypes.bool,
    onRequestClose: PropTypes.func.isRequired,
    projectFilename: PropTypes.string
};

export default SaveToScratchModal;
