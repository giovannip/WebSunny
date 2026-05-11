<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-wiki-rules -->
# Project wiki (LLM Wiki pattern)

A structured, interlinked knowledge base for **WebSunny**. The agent maintains `wiki/`; the human curates sources in `raw/`, asks questions, and guides analysis.

## Purpose

Capture decisions, architecture, flows, integrations, and product context in a navigable form, with source traceability and a change history.

## Folder structure

```
raw/          -- source documents (immutable — never modify these)
wiki/         -- Markdown pages maintained by the agent
wiki/index.md -- table of contents for the entire wiki
wiki/log.md   -- append-only record of wiki operations
```

## Ingest workflow

When the user adds a new source under `raw/` and asks you to ingest it:

1. Read the full source document.
2. Discuss key takeaways with the user before writing anything.
3. Create a summary page in `wiki/` named after the source (see naming rules below).
4. Create or update concept pages for each major idea or entity.
5. Connect pages with wiki-links: `[[page-name]]` maps to `page-name.md`.
6. Update `wiki/index.md` with new pages and one-line descriptions each.
7. Append an entry to `wiki/log.md` with the date, source name, and what changed.

A single source may touch 10–15 wiki pages; that is normal.

## Page format

Every wiki page should follow this structure:

```markdown
# Page Title


**Summary**: One to two sentences describing this page.


**Sources**: List of raw source files this page draws from.


**Last updated**: Date of the most recent meaningful update.


---


Main content. Use clear headings and short paragraphs.


Link to related concepts using [[wiki-links]] throughout the text.


## Related pages


- [[related-concept-1]]
- [[related-concept-2]]
```

## Citation rules

- Every factual claim should reference its source file.
- Use the format `(source: filename.pdf)` or the actual filename in `raw/` after the claim.
- If two sources disagree, note the contradiction explicitly.
- If a claim has no source, mark it as needing verification.

## Question answering

When the user asks a question grounded in the wiki:

1. Read `wiki/index.md` first to find relevant pages.
2. Read those pages and synthesize an answer.
3. Cite specific wiki pages in your response.
4. If the answer is not in the wiki, say so clearly.
5. If the answer is valuable long-term, offer to save it as a new wiki page.

Good answers should be filed back into the wiki so knowledge compounds.

## Lint

When the user asks you to lint or audit the wiki:

- Check for contradictions between pages.
- Find orphan pages (no inbound links from other pages).
- Identify concepts mentioned in pages that lack their own page.
- Flag claims that may be outdated based on newer sources.
- Check that all pages follow the page format above.
- Report findings as a numbered list with suggested fixes.

## Rules

- Never modify anything in `raw/`.
- Always update `wiki/index.md` and `wiki/log.md` after wiki changes.
- Keep page names lowercase with hyphens (e.g. `api-architecture.md`).
- Write in clear, plain language.
- When uncertain about how to categorize something, ask the user.
<!-- END:project-wiki-rules -->
