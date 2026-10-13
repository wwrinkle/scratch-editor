import React from 'react';
import configureStore from 'redux-mock-store';
import {render, fireEvent} from '@testing-library/react';

import HashParserHOC from '../../../src/lib/hash-parser-hoc.jsx';

jest.mock('react-ga');

describe('HashParserHOC', () => {
    const mockStore = configureStore();
    let store;

    beforeEach(() => {
        store = mockStore({
            scratchGui: {
                projectState: {}
            }
        });
    });

    test('when there is a hash, it passes the hash as projectId', () => {
        const Component = ({projectId}) => <div>{projectId}</div>;
        const WrappedComponent = HashParserHOC(Component);
        window.location.hash = '#1234567';
        const mockSetProjectIdFunc = jest.fn();
        render(
            <WrappedComponent
                setProjectId={mockSetProjectIdFunc}
                store={store}
            />
        );
        expect(mockSetProjectIdFunc.mock.calls[0][0]).toBe('1234567');
    });

    test('when there is no hash, it passes 0 as the projectId', () => {
        const Component = ({projectId}) => <div>{projectId}</div>;
        const WrappedComponent = HashParserHOC(Component);
        window.location.hash = '';
        const mockSetProjectIdFunc = jest.fn();
        render(
            <WrappedComponent
                setProjectId={mockSetProjectIdFunc}
                store={store}
            />
        );
        expect(mockSetProjectIdFunc.mock.calls[0][0]).toBe('0');
    });

    test('when the hash is not a number, it passes 0 as projectId', () => {
        const Component = ({projectId}) => <div>{projectId}</div>;
        const WrappedComponent = HashParserHOC(Component);
        window.location.hash = '#winning';
        const mockSetProjectIdFunc = jest.fn();
        render(
            <WrappedComponent
                setProjectId={mockSetProjectIdFunc}
                store={store}
            />
        );
        expect(mockSetProjectIdFunc.mock.calls[0][0]).toBe('0');
    });

    test('when hash change happens, the projectId state is changed', () => {
        const Component = ({projectId}) => <div>{projectId}</div>;
        const WrappedComponent = HashParserHOC(Component);
        window.location.hash = '';
        const mockSetProjectIdFunc = jest.fn();
        render(
            <WrappedComponent
                setProjectId={mockSetProjectIdFunc}
                store={store}
            />
        );
        window.location.hash = '#1234567';
        fireEvent(window, new HashChangeEvent('hashchange', {newURL: window.location.href}));
        expect(mockSetProjectIdFunc.mock.calls.length).toBe(2);
    });
    describe('with a project_url query parameter', () => {
        afterEach(() => {
            window.history.replaceState(null, '', '/');
        });

        test('when there is no hash, it passes the project address as projectId', () => {
            const Component = ({projectId}) => <div>{projectId}</div>;
            const WrappedComponent = HashParserHOC(Component);
            window.history.replaceState(null, '', '/?project_url=https://example.com/songs/ear-exercise.sb3');
            const mockSetProjectIdFunc = jest.fn();
            render(
                <WrappedComponent
                    setProjectId={mockSetProjectIdFunc}
                    store={store}
                />
            );
            expect(mockSetProjectIdFunc.mock.calls[0][0]).toBe('https://example.com/songs/ear-exercise.sb3');
        });

        test('a hash project id takes precedence over the project address', () => {
            const Component = ({projectId}) => <div>{projectId}</div>;
            const WrappedComponent = HashParserHOC(Component);
            window.history.replaceState(null, '', '/?project_url=https://example.com/ear-exercise.sb3#1234567');
            const mockSetProjectIdFunc = jest.fn();
            render(
                <WrappedComponent
                    setProjectId={mockSetProjectIdFunc}
                    store={store}
                />
            );
            expect(mockSetProjectIdFunc.mock.calls[0][0]).toBe('1234567');
        });

        test('a non-HTTPS project address is ignored', () => {
            const Component = ({projectId}) => <div>{projectId}</div>;
            const WrappedComponent = HashParserHOC(Component);
            window.history.replaceState(null, '', '/?project_url=http://example.com/ear-exercise.sb3');
            const mockSetProjectIdFunc = jest.fn();
            render(
                <WrappedComponent
                    setProjectId={mockSetProjectIdFunc}
                    store={store}
                />
            );
            expect(mockSetProjectIdFunc.mock.calls[0][0]).toBe('0');
        });
    });
});
