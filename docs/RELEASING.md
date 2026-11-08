# Releasing

Merging to `main` does not deploy. Publishing a GitHub Release does (#21):
merges collect on `main`, and a release is the decision to ship them. Pull
requests are still checked. The backend releases the same way
(mesh-fire-detection/backend#42).

Versions are [semantic](https://semver.org): `vMAJOR.MINOR.PATCH`. Before 1.0,
a new feature bumps MINOR and a fix bumps PATCH. The version lives in
`package.json`, and the footer shows it, so a bug report can say which release
it was.

## Cutting a release

1. **Open a release pull request** from `main`, titled `chore(release): vX.Y.Z`:
    - `npm version X.Y.Z --no-git-tag-version`, which updates `package.json` and
      `package-lock.json`.
    - In `docs/CHANGELOG.md`, rename `Unreleased` to `X.Y.Z — YYYY-MM-DD` and
      start a new, empty `Unreleased` above it.

2. **Squash-merge it.**

3. **Publish the release** on that merge commit:

    ```sh
    gh release create vX.Y.Z --target main --title vX.Y.Z --notes-file <notes>
    ```

    Paste the changelog section as the notes. `--generate-notes` adds the list
    of pull requests, if wanted.

4. **Watch the deploy** (`gh run watch`). It refuses a tag that is not
   `vX.Y.Z`, that disagrees with `package.json`, or that is not on `main`, then
   runs `npm run check` and deploys that commit to Pages. The footer on
   https://meshfiredetection.org then shows the new version.

A **prerelease** never deploys.

When a feature spans both repositories, release the backend first: the site
calls its new routes, and an old API answers them with a 404.

Blog posts come from `mesh-fire-detection/blog` as it is at build time, not
as it was when the release was tagged.

## Rolling back

Run the deploy by hand with the previous tag:

```sh
gh workflow run pages.yml -f tag=vX.Y.Z
```

## Repository setting

The `github-pages` environment decides which refs may deploy. It must allow
tags matching `v*` as well as `main` (Settings → Environments → github-pages →
Deployment branches and tags), or every release deploy is refused.
