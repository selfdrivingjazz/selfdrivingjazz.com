# SELFDRIVINGJAZZ (selfdrivingjazz.com) — STATE
_Bootstrapped 2026-10-24 from closed owner session 01a12848-09c8-7327-b3eb-4791b26462e2; update before finishing any work._

## Goal
Run the Self-Driving Jazz release site: publish each project as a numbered "SDJ-NNN" record with a front/back album sleeve, a write-up and visit/credits links. Also own SDJ creative side work (cover design, launch films, spikes). jmill.dev has its own owner now, not this project.

## Current state
- **Production:** https://www.selfdrivingjazz.com (Vercel; the apex redirects to www). Last promoted candidate is `9a9586f2506a-b837e93e` (commit `9a9586f`, crate mobile layout), promoted 2026-10-22 07:42 UTC.
- **Branch:** `rc/method-projects-polish` (HEAD `9a9586f`). Remote is `github.com/selfdrivingjazz/selfdrivingjazz.com`.
- **Tailnet preview:** https://jmill-desktop.tail587341.ts.net:8447 (MTS service `selfdrivingjazz`). It serves committed rc candidates only. Last known: the same build as production [unverified after 2026-10-22].
- **Crate order (newest first):** AI 2053 SDJ-020 → vamp SDJ-019 → Ambient Communal Intelligence SDJ-018 → ciaude.ai SDJ-017 → Cuelight SDJ-016 → Art Basil → Introverse → Older Works sleeve. 20 project MDX files.
  - Mulabonding has `crate: 13` and has since been pushed into Older Works.
  - Whalechess has `crate: false` and `live: false`, so it shows no visit button.
- **Visit links:**
  - vamp.sh, cuelight.sh, artbasil.fyi, https://ciaude.ai and https://ai-2053.com.
  - ACI links to https://selfdrivingjazz.substack.com/p/ambient-communal-intelligence.
  - The visit buttons have no arrow glyph (`e27d8d1`).
- **Covers:**
  - vamp (lowercase): front Wing Study, back Four Beats.
  - Older Works: front 006 (LoRA), back 2.
  - ciaude.ai: front Odd One Out, back 02 (lying i).
  - AI 2053: front 01 Mirror Hall, back 01 Show-through.
  - ACI: front Skyline (VAMP asset `30a59e16-…`), back 02.
- **Write-ups:** the SDJ 015–020 write-ups have real screenshots and photos (`781b84d`, 2026-10-20). The same six are live on jmill.dev (`/c/<slug>`).
- **Logo:** traced SVG `public/sdj-logo.svg` with the pupil restored (`b323850`).
- **Frontpage background:** `CrateBackdrop`, a quiet spotlight room built from precomputed per-sleeve palettes (about 24 s ±2° sway, ~0.9 s colour fade, no flash). Detail pages use the blurred-cover backdrop.
- **AI 2053 note:** `status: "live"`, set by jmill in Obsidian around 2026-10-20. The old "private preview" question is resolved.

## Open work
- **Crate mobile layout** (`9a9586f`, live 2026-10-22): tested only at 18 emulated viewports, never on a real iPhone or Safari with its toolbars. Needs a real-device check.
- **OpenPanel analytics (2026-10-24):** the 2026-10-15 production-only migration is now owned by the released-sites rollout. The existing write-client ID was recovered from the dashboard, and `NEXT_PUBLIC_OPENPANEL_CLIENT_ID` + `NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT=production` were configured in Vercel Production. Analytics-only production promotion is authorized by jmill's rollout request. The SDK remains disabled on tailnet candidates and with DNT/GPC. Root API credentials for agent-side queries/provisioning are tracked by JMI-38.
- **Cuelight screenshot:** add a screenshot of the cuelight.sh site once the domain resolves. It did not resolve on 2026-10-20; Cuelight currently uses controller screenshots. Cuelight's status is "in development".
- **AI 2053 launch film and 7-post thread** (2026-10-19):
  - Ready on MTS: https://jmill-desktop.tail587341.ts.net/outputs/result-ai2053-launch-film-thread-final-20261019
  - Files are in `/home/jmill/sdj/tmp/ai2053-launch-20261019/`.
  - jmill picks the post-1 hook and posts it himself. Not tested on a phone or with an X upload.
- **"Went Vertical" GitHub hall-of-fame spike** (done 2026-10-19):
  - Report: `nhx4b/robots/Went Vertical GitHub hall of fame spike - 2026-10-19.md`.
  - Data: `/home/jmill/sdj/tmp/sdj-gh-vertical-20261019/`.
  - Next step is jmill's call: invite the top 2–3 candidates (The412Banner, dollspace-gay, eGurucharri) into a private, opt-in "Catalogue No. 1". Nobody has been contacted.
- **Cosign fit note** (done 2026-10-19): `nhx4b/robots/Cosign fit for jmill and SDJ - 2026-10-19.md`. Its verdict: a serious jmill presence, not an SDJ parody account (the terms forbid that). Nothing was signed up for.
- **Resource hold** (2026-10-22): no new multi-worker heavy browser, render or build batches until Infra agrees a resource budget [status after 2026-10-22 unverified].
- **jmill.dev taglines:** handed to the jmill.dev owner (`01a04303-720c-7279-9fa6-af7687c59bbf`). Its importer should fall back to `summary:`, or jmill writes `tagline:` himself. SDJ does not touch jmill.dev.

## Waiting on jmill
- Check the homepage crate on a real iPhone (Safari, toolbars, text zoom).
- Save the OpenPanel root API credential in 1Password (`sdj` → `OpenPanel API`), JMI-38. No additional analytics production go is needed.
- Pick the AI 2053 thread hook ("How, exactly, could every evaluation pass by 2041?" or "…does a forecast turn into a house?") and post it himself.
- Go or no-go on Catalogue No. 1 outreach for Went Vertical.
- Optional: write short `tagline:` values in the six recent vault notes. Agents won't invent that copy.
- Production promotion always needs jmill's explicit approval.

## Decisions & preferences jmill stated
- Taste:
  - Dislikes bland, busy or high-motion work. On the background: "way too much motion and i hate the flash on flip… the spotlight is okay. let's do something subtle".
  - He rejected image-sampled and blurred-cover frontpage backgrounds.
- "vamp is stylized lowercase".
- **Buttons:** "two buttons visit (primary) and credits"; visit appears only when the project has an external link. Whalechess gets no visit button ("it's not live anymore").
- **Catalogue tiles:** "reserve 3 lines for title and 2 for desc", so tiles have even heights.
- **Visit button:** "remove the arrow emoji from the visit button".
- **Cover VAMP rule:** "add all images generated to my vamp server, namespaced". Register cover originals in VAMP before publishing to MTS, with an "Open in Vampire" link.
- **Visual publication policy** (2026-10-24): proof, QA and checkpoint screenshots go to MTS Outputs only. VAMP is only for deliberate references, real design candidates and assets jmill asks to keep. When unsure, use MTS only.
- **Write-up media scope:** only add images to newer write-ups that have none. Never touch older or already-illustrated releases.
- **Hardware:** never reboot or touch the NVIDIA drivers while agents are running.
- **Messaging:** never deliver messages through another session's terminal or composer. Use Collab prompts or watched files.

## Gotchas
- Never commit the other session's analytics lines. Several files mix both sets of edits, so commit only explicit paths or hunks (`git commit --only -- <paths>`). A past deploy failed after their lines leaked into a commit.
- Never hand-edit `content/projects/`, `content/older-works.json`, `public/project-covers/` or `public/project-media/`. They are generated by `npm run sync:vault`.
- The preview cannot see working-tree changes. Commit first, then build a candidate.
- **ciaude.ai parody rules:** never write or draw "claude"; the title is exactly "ciaude.ai"; no Anthropic or Claude marks.
- Image models often misspell the parody title. Check the lettering before you ship a cover.
- The `scripts/vault.ts` slugify maps `.` to `-`, so ciaude.ai becomes `ciaude-ai`.
- **Logo caching:** the SVG logo is a cached `/sdj-logo.svg`, so browsers may show the old one until they reload.
- **MTS cover reviews:** full-size PNGs are slow over the tailnet. Publish contact sheets, with the originals in a ZIP.
- **LoRA (ComfyUI):** it OOM'd and stalled on 2026-10-11. Codex image generation with a reference image was the fallback.

## Key paths / commands
- **Repo:** `/home/jmill/sdj/projects/websites/selfdrivingjazz.com`. Read its `AGENTS.md` for the vault fields (`catalog`, `crate`, `live`, `url`, `cover`, `back-cover`, …).
- **Vault notes:** `/home/jmill/sdj/nhx4b/nobody/publish/project/*.md`; covers live in `nobody/attachments/`.
- **Covers:**
  - `npm run covers -- <slug> [--back]`, then `npm run use-cover -- <slug> design/.candidates/<…>/candidate-N.png [--back]`, then `npm run sync:vault`.
  - Skill: `infra/ops/skills/album-cover-candidates/SKILL.md`.
- **Release** (from `/home/jmill/sdj/infra/ops`):
  - Preview: `bin/sdj selfdrivingjazz candidate --ref rc/method-projects-polish`, then `restart`, then `status --json`.
  - Production (approval only): `bin/sdj selfdrivingjazz promote --candidate <id> --approve-production`.
- **Check before committing:** `npm run typecheck && npm run build`.
- **VAMP:**
  - Library id `a76f6914-40b9-4789-8eb5-7f7cf2b20d2d`; explorations are named `sdj-album-covers-<slug>`, with folders `front|back/<run>`; `VAMP_ACTOR=agent:SelfDrivingJazzCovers`.
  - Folder link: `vampire://open?library=<id>&folder=<folder_id>`.
- **Publishing to MTS:** `python3 /home/jmill/.omp/agent/skills/publish-output/scripts/publish.py [--link "Open in Vampire=vampire://…"]`. URLs follow `https://jmill-desktop.tail587341.ts.net/outputs/result-<id>`.
- **Past reports:** `/home/jmill/sdj/tmp/sdj-*-report.md` and `/home/jmill/sdj/tmp/shrimp-svg-20261017-*report.md`.
- **Analytics env vars** (names only; set in the Vercel Production env): `NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT`, `NEXT_PUBLIC_OPENPANEL_CLIENT_ID`, `NEXT_PUBLIC_OPENPANEL_API_URL`.
