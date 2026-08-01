# Vision

Write formatted output once, render as markdown, terminal, HTML, or plain text.

## Unique Position

The only write-time multi-format abstraction built on [mdast](https://github.com/syntax-tree/mdast). Unlike read-time tools that parse existing markdown (marked-terminal, markdown-to-ansi), this library lets you compose structured output programmatically and choose the format at render time.

## In Scope

* Text formatting primitives (headers, bold, italic, code, links, lists, tables)
* Multiple output modes: markdown, chalk/ANSI terminal, HTML, plain text
* Integration with the mdast/unified ecosystem via `fromMdast()`
* GFM features: tables, strikethrough, task lists, alerts
* Log symbols with mode-appropriate rendering

## Out of Scope

* Interactive CLI UIs (use [ink](https://github.com/vadimdemedes/ink))
* Task runners / progress bars (use [listr2](https://github.com/listr2/listr2))
* Full markdown parsing (use [remark](https://github.com/remarkjs/remark) + `fromMdast()`)
* React/component model
* Streaming or buffered output accumulation
* MDX / JSX node types
* Syntax highlighting in HTML mode (consumers choose their own highlighter)

## Principles

1. **Zero new runtime deps for new modes** — custom handlers, not AST pipelines
2. **Semantic output** — `<strong>` not `<span class="bold">`, `~~text~~` not custom syntax
3. **Backward-compatible evolution** — breaking changes come with a documented migration path, new modes are additive
4. **mdast-native** — build on the standard, don't reinvent AST formats
5. **Callers own their content** — no input sanitization (except URL control chars); document safety expectations

## Non-Goals

* Replacing chalk — it's an output backend, not a competitor
* Becoming a unified processor — stay a lightweight formatter
* Supporting every mdast extension — focus on core + GFM
* Presentation styling (colors, fonts) in HTML mode — emit semantic HTML, consumers style it
