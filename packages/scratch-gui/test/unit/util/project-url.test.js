import {
    getFilenameFromProjectUrl,
    getProjectUrlFromSearch,
    isProjectUrl
} from '../../../src/lib/project-url';

describe('getProjectUrlFromSearch', () => {
    test('returns an HTTPS project address', () => {
        expect(getProjectUrlFromSearch('?project_url=https://example.com/a.sb3'))
            .toBe('https://example.com/a.sb3');
    });
    test('decodes an encoded project address', () => {
        expect(getProjectUrlFromSearch('?project_url=https%3A%2F%2Fexample.com%2Fa.sb3%3Fv%3D2'))
            .toBe('https://example.com/a.sb3?v=2');
    });
    test('returns null when the parameter is missing, empty or not HTTPS', () => {
        expect(getProjectUrlFromSearch('')).toBeNull();
        expect(getProjectUrlFromSearch('?project_url=')).toBeNull();
        expect(getProjectUrlFromSearch('?project_url=http://example.com/a.sb3')).toBeNull();
        expect(getProjectUrlFromSearch('?project_url=javascript:alert(1)')).toBeNull();
    });
});

describe('isProjectUrl', () => {
    test('tells HTTPS addresses apart from Scratch project ids', () => {
        expect(isProjectUrl('https://example.com/a.sb3')).toBe(true);
        expect(isProjectUrl('1234567')).toBe(false);
        expect(isProjectUrl('0')).toBe(false);
        expect(isProjectUrl(null)).toBe(false);
    });
});

describe('getFilenameFromProjectUrl', () => {
    test('returns the decoded last path segment', () => {
        expect(getFilenameFromProjectUrl('https://example.com/songs/ear%20exercise.sb3?v=2'))
            .toBe('ear exercise.sb3');
    });
});
