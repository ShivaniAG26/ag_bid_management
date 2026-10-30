# bidPlan — working rules

bidPlan is a static web app: `index.html` loads the `*.js` modules in order, `films/` holds media. No build step — open `index.html` in a browser.

## Branching (standing instruction — always follow)

- `main` is the integration branch. Never commit feature work directly to `main`.
- Every new feature or change request starts on its own branch cut from the latest `main`:
  `git fetch origin main && git checkout -b <feature-branch> origin/main`
  Several sessions/chat windows may work in parallel, each on its own branch.
- Commit and push to that branch, then open a pull request into `main`.
- Before merging, bring in the latest `main` (`git merge origin/main`) and resolve conflicts so that
  **both sides' behaviour is preserved** — no UI or UX changes beyond what each branch intended.
  After resolving, verify the merged app still loads and the feature behaves as it did on its branch.
- Merge the PR into `main` only when the user says the feature is ready.

## Previews

Every push is published to GitHub Pages by `.github/workflows/preview.yml`:

- `main` → https://shivaniag26.github.io/ag_bid_management/
- any other branch → https://shivaniag26.github.io/ag_bid_management/preview/<branch-name-with-/-replaced-by-->/
- list of all live previews → https://shivaniag26.github.io/ag_bid_management/previews.html

Mention the preview link for the branch when reporting a change.
