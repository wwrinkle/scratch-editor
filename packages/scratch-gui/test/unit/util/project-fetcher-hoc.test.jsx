import React from 'react';
import configureStore from 'redux-mock-store';

import {renderWithIntl} from '../../helpers/intl-helpers.jsx';

import ProjectFetcherHOC from '../../../src/lib/project-fetcher-hoc.jsx';
import {LoadingState} from '../../../src/reducers/project-state';
import {LegacyStorage} from '../../../src/lib/legacy-storage';
import {IntlProvider} from 'react-intl';
import {waitFor} from '@testing-library/react';

jest.mock('react-ga');

describe('ProjectFetcherHOC', () => {
    const mockStore = configureStore();
    let store;
    let storage;

    beforeEach(() => {
        const storageConfig = new LegacyStorage();
        storage = storageConfig.scratchStorage;
        store = mockStore({
            scratchGui: {
                config: {storage: storageConfig},
                projectState: {}
            }
        });
    });

    test('when there is an id, it tries to update the store with that id', () => {
        const Component = ({projectId}) => <div>{projectId}</div>;
        const WrappedComponent = ProjectFetcherHOC(Component);
        const mockSetProjectIdFunc = jest.fn();
        renderWithIntl(
            <WrappedComponent
                projectId="100"
                setProjectId={mockSetProjectIdFunc}
                store={store}
            />
        );
        expect(mockSetProjectIdFunc.mock.calls[0][0]).toBe('100');
    });
    test('when there is a reduxProjectId and isFetchingWithProjectId is true, it loads the project', () => {
        const mockedOnFetchedProject = jest.fn();
        const originalLoad = storage.load;
        storage.load = jest.fn((type, id) => Promise.resolve({data: id}));
        const Component = ({projectId}) => <div>{projectId}</div>;
        const WrappedComponent = ProjectFetcherHOC(Component);
        const {rerender} = renderWithIntl(
            <WrappedComponent
                store={store}
                onFetchedProjectData={mockedOnFetchedProject}
            />
        );
        rerender(
            <IntlProvider
                locale="en"
                messages={{ }}
            >
                <WrappedComponent
                    store={store}
                    onFetchedProjectData={mockedOnFetchedProject}
                    reduxProjectId="100"
                    isFetchingWithId
                    loadingState={LoadingState.FETCHING_WITH_ID}
                />
            </IntlProvider>
        );

        expect(storage.load).toHaveBeenLastCalledWith(
            storage.AssetType.Project, '100', storage.DataFormat.JSON
        );
        storage.load = originalLoad;
        // delay needed since storage.load is async, and onFetchedProject is called in its then()
        setTimeout(
            () => expect(mockedOnFetchedProject)
                .toHaveBeenLastCalledWith('100', LoadingState.FETCHING_WITH_ID),
            1
        );
    });
    test('when the reduxProjectId is an HTTPS address, it fetches the project from that address', async () => {
        const projectData = new ArrayBuffer(8);
        const originalFetch = global.fetch;
        global.fetch = jest.fn(() => Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(projectData)
        }));
        const mockedOnFetchedProject = jest.fn();
        const mockedOnSetProjectTitle = jest.fn();
        const projectUrl = 'https://example.com/songs/ear%20exercise.sb3';
        const Component = ({projectId}) => <div>{projectId}</div>;
        const WrappedComponent = ProjectFetcherHOC(Component);
        const {rerender} = renderWithIntl(
            <WrappedComponent
                store={store}
                onFetchedProjectData={mockedOnFetchedProject}
                onSetProjectTitle={mockedOnSetProjectTitle}
            />
        );
        rerender(
            <IntlProvider
                locale="en"
                messages={{ }}
            >
                <WrappedComponent
                    store={store}
                    onFetchedProjectData={mockedOnFetchedProject}
                    onSetProjectTitle={mockedOnSetProjectTitle}
                    reduxProjectId={projectUrl}
                    isFetchingWithId
                    loadingState={LoadingState.FETCHING_WITH_ID}
                />
            </IntlProvider>
        );

        expect(global.fetch).toHaveBeenLastCalledWith(projectUrl);
        await waitFor(() => expect(mockedOnFetchedProject)
            .toHaveBeenLastCalledWith(projectData, LoadingState.FETCHING_WITH_ID));
        expect(mockedOnSetProjectTitle).toHaveBeenLastCalledWith('ear exercise');
        global.fetch = originalFetch;
    });
    test('when fetching from an HTTPS address fails, it reports an error', async () => {
        const originalFetch = global.fetch;
        global.fetch = jest.fn(() => Promise.resolve({ok: false, status: 404}));
        const mockedOnError = jest.fn();
        const mockedOnFetchedProject = jest.fn();
        const Component = ({projectId}) => <div>{projectId}</div>;
        const WrappedComponent = ProjectFetcherHOC(Component);
        const {rerender} = renderWithIntl(
            <WrappedComponent
                store={store}
                onError={mockedOnError}
                onFetchedProjectData={mockedOnFetchedProject}
            />
        );
        rerender(
            <IntlProvider
                locale="en"
                messages={{ }}
            >
                <WrappedComponent
                    store={store}
                    onError={mockedOnError}
                    onFetchedProjectData={mockedOnFetchedProject}
                    reduxProjectId="https://example.com/missing.sb3"
                    isFetchingWithId
                    loadingState={LoadingState.FETCHING_WITH_ID}
                />
            </IntlProvider>
        );

        await waitFor(() => expect(mockedOnError).toHaveBeenCalled());
        expect(mockedOnFetchedProject).not.toHaveBeenCalled();
        global.fetch = originalFetch;
    });
});
