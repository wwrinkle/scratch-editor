// FORK_VERSION, FORK_COMMIT, and FORK_BUILD_DATE are injected at build time via
// webpack.DefinePlugin (see webpack.config.js). Locally, without CI-provided values,
// commit and build date are unavailable and version falls back to the package version.
const FORK_NAME = 'Sonic Logic Academy';
const FORK_FEATURE = 'Piano Roll';

const forkInfo = {
    name: FORK_NAME,
    feature: FORK_FEATURE,
    version: process.env.FORK_VERSION || 'dev',
    commit: process.env.FORK_COMMIT || null,
    buildDate: process.env.FORK_BUILD_DATE || null
};

export default forkInfo;
