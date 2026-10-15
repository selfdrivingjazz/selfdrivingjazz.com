# selfdrivingjazz.com

Next.js site. Project content is **generated from the Obsidian vault**; never
hand-edit `content/projects/`, `content/older-works.json`,
`public/project-covers/` or `public/project-media/`.

## Content: Obsidian vault → site

Source of truth: `/home/jmill/sdj/nhx4b/nobody/publish/project/*.md` (the
same notes jmill.dev reads). A note is published when `publish: true`; its
title is the filename without the leading emoji. Site frontmatter fields:

| field | use |
| --- | --- |
| `catalog` | label `SDJ-<n>`, unique, higher = newer; sets order |
| `summary`, `status` | one-line summary, project status |
| `year`, `genre`, `artist`, `url` | year, format, collaborators, outbound link |
| `cover`, `cover-alt` | `"[[attachment]]"` in `nobody/attachments/` + alt text |
| `back-cover`, `back-cover-alt` | optional flip side: detail-page flip and the crate sleeve's reverse |
| `ambience` | optional three hex colours for the background |

The note body is the write-up: H1 lines are dropped, `![[image]]` embeds are
copied as optimised WebP into `public/project-media/<slug>/`, and `[[links]]`
become text (or links to other project pages).

```sh
npm run sync:vault    # regenerate content + images from the vault; commit the result
```

The sync fails loudly on missing fields or duplicate catalogue numbers. It also
requires `nobody/attachments/sdj-cover-older-works.<png|jpg|webp>` (optional
`sdj-cover-older-works-back.*`): the crate's "older works" sleeve standing in for
releases beyond the newest seven. Image filenames carry a content hash, so a
replaced image always gets a new URL.

## Covers: Codex image generation → vault

```sh
npm run covers -- <slug> [--count 3] [--direction "…"]   # front cover
npm run covers -- <slug> --back                          # reverse of the note's current cover
npm run covers -- older-works [--back]                   # the crate's back-catalogue sleeve
npm run use-cover -- <slug|older-works> design/.candidates/<…>/<run>/candidate-N.png [--back]
npm run sync:vault
```

Generation takes about a minute per image, longer with parallel runs: give
agent shells a timeout of 10+ minutes for a 3–4 image run.

`covers` runs `codex exec` with the built-in image tool (uses the ChatGPT plan
Codex is signed in with) and the brief in `design/cover-direction.md`: fixed
house rules (1958–75 British–Swiss print modernism) plus a list of `### ` series;
each candidate gets a different random series. It then publishes to MTS Outputs.
`--with-references` also attaches `design/cover-references/`; it is off by
default because the model copies attached covers too literally. `use-cover`
copies the pick into the vault and updates the note.

Every original a `covers` run generates — fronts and backs, rejects and
alternatives, and the completed images of a failed run — must also be
registered in the owner's VAMP library (exploration `sdj-album-covers-<slug>`,
folder `front|back/<run>`) before the run is reported done. Follow
"Register every original in VAMP" in
`infra/ops/skills/album-cover-candidates/SKILL.md` (`/home/jmill/sdj`); it
applies to these Codex runs as well as to ComfyUI ones.

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
