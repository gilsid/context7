# Context7 Plugin for OpenCode (v2)

> Personal fork of the upstream Context7 OpenCode plugin
> ([upstash/context7](https://github.com/upstash/context7), MIT),
> ported to the OpenCode v2 plugin API. V1 (`@opencode-ai/plugin`) support was
> removed. For private use; not published to npm.

Context7 solves a common problem with AI coding assistants: outdated training data and hallucinated APIs. Instead of relying on stale knowledge, Context7 fetches current documentation directly from source repositories.

## What's Included

Installing the plugin adds two things to OpenCode:

- **MCP Server** - The hosted Context7 server, with `context7_resolve-library-id` and `context7_query-docs`
- **Skill** - `context7-mcp` auto-triggers documentation lookups when you ask about libraries

## Installation

```bash
opencode plugin add github:gilsid/context7::path:packages/opencode
```

The command installs the plugin and adds it to your OpenCode config. You can also add it by hand:

```jsonc // opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:gilsid/context7::path:packages/opencode"]
}
```

Restart OpenCode after installing. On the first documentation lookup, OpenCode opens a browser window so you can log in to Context7 via OAuth, which gives you your account's rate limits.

## API Key

OAuth is the default and needs no configuration. If you would rather use an API key, for example on a headless machine, create one in the [Context7 dashboard](https://context7.com/dashboard) and export it before launching OpenCode:

```bash
# e.g. in ~/.zshrc or ~/.bashrc
export CONTEXT7_API_KEY="your-api-key"
```

The plugin picks up `CONTEXT7_API_KEY` automatically and sends it as an `Authorization` header instead of running the OAuth flow. You can also pass the key through the plugin options:

```jsonc // opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [{ "package": "github:gilsid/context7::path:packages/opencode", "options": { "apiKey": "your-api-key" } }]
}
```

## Personal Single-File Install (no service restart needed for the edit itself)

This repo builds to one self-contained file — the skill markdown is inlined
at build time, the only runtime import is `@opencode/plugin` (provided by the
OpenCode host):

```bash
# from packages/opencode
pnpm build   # or: tsup
cp dist/index.js ~/.config/opencode/plugins/context7.js
# remove the trailing sourceMappingURL line, then restart OpenCode yourself
```

No `plugins` config entry is needed; files directly under
`~/.config/opencode/plugins/` are auto-loaded. Re-copy the file after every
source change.

## Overriding What the Plugin Adds

Both entries are additive, and an entry you configure yourself always wins. If your `opencode.jsonc` already defines an MCP server named `context7` or a skill named `context7-mcp`, the plugin leaves it untouched.

## Usage

The skill triggers on its own when you ask about a library:

- "How do I set up authentication in Next.js 15?"
- "Show me React Server Components examples"
- "What's the Prisma syntax for relations?"

## Available Tools

### context7_resolve-library-id

Searches for libraries and returns Context7-compatible identifiers.

```
Input: "next.js"
Output: { id: "/vercel/next.js", name: "Next.js", versions: ["v15.1.8", "v14.2.0", ...] }
```

### context7_query-docs

Fetches documentation for a specific library, ranked by relevance to your question.

```
Input: { libraryId: "/vercel/next.js", query: "app router middleware" }
Output: Relevant documentation snippets with code examples
```

## Version Pinning

To get documentation for a specific version, include the version in the library ID:

```
/vercel/next.js/v15.1.8
/supabase/supabase/v2.45.0
```

The `context7_resolve-library-id` tool returns available versions, so you can pick the one that matches your project.

## License

MIT — see the `LICENSE` file at the repo root.
Original work Copyright (c) 2021 Upstash, Inc.; v2 port changes in this fork
are also released under MIT.
