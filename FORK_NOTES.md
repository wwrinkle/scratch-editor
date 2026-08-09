# Fork notes

This repository is a fork of [scratchfoundation/scratch-editor](https://github.com/scratchfoundation/scratch-editor),
maintained by Sonic Logic Academy. It is not affiliated with or endorsed by the Scratch Team or the Scratch
Foundation. See [NOTICE](NOTICE) for license and attribution details.

## What's different from upstream

- **Piano roll visualizer** (`packages/scratch-gui/src/components/piano-roll/`) — a new panel added to the stage
  header for visualizing note/pitch activity.
- **Recolored logo mark** in the editor menu bar (`packages/scratch-gui/src/components/menu-bar/fork-logo*.svg`),
  distinguishing this build from upstream Scratch at a glance.
- **Fork/version info** shown next to the logo in the menu bar, sourced from
  `packages/scratch-gui/src/lib/fork-info.js`.

## Build info plumbing

`fork-info.js` reads `FORK_VERSION`, `FORK_COMMIT`, and `FORK_BUILD_DATE` from `process.env`, wired through
`webpack.DefinePlugin` in `packages/scratch-gui/webpack.config.js`. Locally these fall back to the package version
and `null`/`dev` placeholders.

Once this repository has a CI pipeline, that pipeline should set these before the `scratch-gui` build step, e.g.:

```sh
export FORK_COMMIT="$(git rev-parse --short HEAD)"
export FORK_BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

`FORK_VERSION` already defaults to the `scratch-gui` package version and normally doesn't need to be set explicitly
unless a build should report a different version string.
