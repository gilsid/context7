import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Plugin, Skill } from "@opencode/plugin";

const MCP_BASE_URL = "https://mcp.context7.com";
const MCP_URL = `${MCP_BASE_URL}/mcp`;
const MCP_OAUTH_URL = `${MCP_BASE_URL}/mcp/oauth`;
const MCP_SERVER_NAME = "context7";

const currentDir = dirname(fileURLToPath(import.meta.url));
const SKILL_FILE = join(currentDir, "..", "skills", "context7-mcp", "SKILL.md");

export interface Context7PluginOptions {
  apiKey?: string;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function parseFrontmatter(raw: string): { name: string; description: string; content: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const fallback = {
    name: "context7-mcp",
    description:
      "Use Context7 to fetch current library documentation instead of relying on training data.",
    content: raw,
  };
  if (!match) return fallback;
  const frontmatter = match[1];
  const content = match[2].trim().length > 0 ? match[2] : raw;
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? fallback.name;
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? fallback.description;
  return { name, description, content };
}

/**
 * Personal fork of the upstream Context7 OpenCode plugin, ported to the
 * OpenCode v2 plugin API. V1 support was removed.
 *
 * Upstream: https://github.com/upstash/context7 (MIT, Copyright (c) 2021 Upstash, Inc.)
 * The Context7 API backend remains a hosted service; this plugin only wires
 * the MCP server config plus the documentation skill into OpenCode.
 */
export default Plugin.define({
  id: "context7",
  async setup(ctx) {
    const apiKey =
      nonEmptyString((ctx.options as Context7PluginOptions)?.apiKey) ??
      nonEmptyString(process.env.CONTEXT7_API_KEY);

    await ctx.mcp.transform((editor) => {
      // Additive: never override a server the user configured themselves.
      if (editor.get(MCP_SERVER_NAME)) return;
      if (apiKey) {
        editor.set(MCP_SERVER_NAME, {
          type: "remote",
          url: MCP_URL,
          headers: { Authorization: `Bearer ${apiKey}` },
          oauth: false,
        });
      } else {
        editor.set(MCP_SERVER_NAME, {
          type: "remote",
          url: MCP_OAUTH_URL,
        });
      }
    });

    await ctx.skill.transform((editor) => {
      const { name, description, content } = parseFrontmatter(readFileSync(SKILL_FILE, "utf8"));
      const id = name;
      if (editor.get(id)) return;
      editor.add({
        id: id as Skill.ID,
        name: name as Skill.Name,
        description,
        path: SKILL_FILE as Skill.Info["path"],
        content,
      });
    });
  },
});
