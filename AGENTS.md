# selfdrivingjazz.com

Next.js site; content lives in `content/projects/*.mdx`.

## Tailnet preview (MTS service `selfdrivingjazz`)

`https://jmill-desktop.tail587341.ts.net:8447` serves an immutable release
candidate exported from a **committed** `rc/*` branch — never this working
tree. Uncommitted or unpublished-candidate changes are invisible there.

After finishing a change the user should review:

```sh
# here: commit on the current rc/* branch
npm run typecheck && npm run build
git commit -am "…"
# from infra/ops/
bin/sdj selfdrivingjazz candidate --ref <rc-branch>
bin/sdj selfdrivingjazz restart          # `start` if stopped
bin/sdj selfdrivingjazz status --json    # Revision must match the new commit
```

Production (`bin/sdj selfdrivingjazz promote …`) requires explicit user approval.
Full SOP: `infra/ops/README.md` → "Self-Driving Jazz release candidates".
