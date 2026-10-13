/**
 * Projects can be opened from any HTTPS address with `?project_url=<address>`. The address is
 * stored as the project id, so the normal fetch-by-id loading flow handles it; these helpers tell
 * that kind of id apart from a numeric Scratch project id.
 */

/**
 * @param {?string} projectId a project id from the redux store
 * @returns {boolean} true if the id is an HTTPS address rather than a Scratch project id
 */
export const isProjectUrl = projectId => {
    if (typeof projectId !== 'string') return false;
    try {
        return new URL(projectId).protocol === 'https:';
    } catch {
        return false;
    }
};

/**
 * Read the project address from a location's query string.
 * @param {string} search location.search, e.g. `?project_url=https://example.com/song.sb3`
 * @returns {?string} the address, or null if absent or not an HTTPS URL
 */
export const getProjectUrlFromSearch = search => {
    const projectUrl = new URLSearchParams(search).get('project_url');
    return isProjectUrl(projectUrl) ? projectUrl : null;
};

/**
 * @param {string} projectUrl an HTTPS project address
 * @returns {string} the last path segment, decoded, e.g. `ear-exercise.sb3`
 */
export const getFilenameFromProjectUrl = projectUrl => {
    const segments = new URL(projectUrl).pathname.split('/');
    const filename = segments[segments.length - 1];
    try {
        return decodeURIComponent(filename);
    } catch {
        return filename; // malformed percent-encoding; use it as written
    }
};
