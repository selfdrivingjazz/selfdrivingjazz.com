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
| `live` | `false` when the project is no longer online: no visit buttons (`url` stays for other readers) |
| `crate` | homepage crate place: omitted = by `catalog`; `false` = never; a number = sits as that catalogue number (newer releases still push it out) |
| `cover`, `cover-alt` | `"[[attachment]]"` in `nobody/attachments/` + alt text |
| `back-cover`, `back-cover-alt` | optional flip side: detail-page flip and the crate sleeve's reverse |

The note body is the write-up: H1 lines are dropped, `![[image]]` embeds are
copied as optimised WebP into `public/project-media/<slug>/`, and `[[links]]`
become text (or links to other project pages).

Cover colours are generated too, never set by hand: the sync samples each front
and back cover (`scripts/cover-palette.ts`) and writes `ambience` (three hex
colours: dominant, strongest accent, next accent), `backAmbience` (only with a
back cover; consumers fall back to that record's own `ambience`), `placeholder`
(loading gradient) and `coverColor` (average) into the MDX frontmatter, and the
same palette fields plus `coverColor` into `content/older-works.json`. The site
reads these fields and never decodes artwork at request time; replacing a cover
and re-syncing updates its colours.

The frontpage background (`CrateBackdrop`) is a quietly lit room around the
crate built only from those palettes, so nothing waits on artwork: an overhead
key light in the most colourful accent that drifts very slowly, and a soft pool
of light on the floor. It follows the active crate record and the face turned
toward the camera, including the Older Works sleeve; crate activation switches
immediately and scroll follows the snap target, with the colours fading across.
Reduced-motion preferences stop the drift and the fade. The projects index keeps
the drifting `AmbientField`; detail pages use the blurred cover backdrop.

The crate layout is one system for every record, whatever the length of its
title and summary: the crate never moves between records, and each entry's copy
(meta, title, summary, buttons) fits in full at every viewport. Desktop and
short landscape screens put the copy beside the crate, starting on a shared
line; narrow portrait screens stack it under the crate, which takes the height
the tallest entry's copy leaves free (measured in `CrateScrollExperience`), and
on phones titles keep to two lines (`lib/titleFit.ts`). Fix layout problems in
that system, never per record or by editing vault prose.

```sh
npm run sync:vault    # regenerate content + images from the vault; commit the result
```

The sync fails loudly on missing fields or duplicate catalogue numbers. It also
requires `nobody/attachments/sdj-cover-older-works.<png|jpg|webp>` (optional
`sdj-cover-older-works-back.*`): the crate's "older works" sleeve standing in for
releases without their own crate sleeve (beyond the seven highest crate places). Image filenames carry a content hash, so a
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

## Analytics (OpenPanel, production only)

`src/components/Analytics.tsx` + `src/lib/analytics.ts` use `@openpanel/web`.
Nothing loads unless **all** hold: `NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT=production`,
a valid `NEXT_PUBLIC_OPENPANEL_CLIENT_ID`, the page is served from
`https://www.selfdrivingjazz.com` (the apex redirects there), and the browser
sends neither Do Not Track nor Global Privacy Control. Otherwise the SDK chunk
is never fetched and no request is made — dev, localhost, Vercel preview URLs
and the tailnet release candidate stay silent even if they inherit the
production variables (candidates copy `.env.local`, so never rely on env alone).

| variable | value |
| --- | --- |
| `NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT` | `production` (anything else disables) |
| `NEXT_PUBLIC_OPENPANEL_CLIENT_ID` | public OpenPanel client ID for this site (no client secret, ever) |
| `NEXT_PUBLIC_OPENPANEL_API_URL` | optional; defaults to `https://api.openpanel.dev`, must be HTTPS without credentials or query |

These are public build-time values inlined into the client bundle: set them
only in the Vercel project's **Production** environment, which the approved
`promote` build (`vercel deploy --prod` from the candidate's commit) uses, and
redeploy after changing them. Keep them out of `.env.local`.

Auto-capture, outgoing-link and `data-track` attribute tracking, session
replay, identify and profiles are all off; an SDK filter drops anything but
the events below. Page views send origin + path (no query string or hash)
and the public page title; the referrer is reduced to an external origin. Named events:

| event | properties | fired by |
| --- | --- | --- |
| `project_open` | `project` (slug), `source` (`crate`\|`index`) | crate story link, projects page tiles |
| `project_link_open` | `project` (slug) | detail page "visit project" |
| `contact_open` | `channel` (`github`\|`x`\|`substack`) | about page links |

Tracking is fire-and-forget and never blocks navigation. Smoke check on
production: devtools Network filtered to `openpanel` shows a `/track`
`screen_view` POST on load and `project_open` after opening a record; on the
tailnet candidate, or with DNT/GPC enabled, the same filter stays empty.
