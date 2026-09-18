import { getCookie, setCookie } from "@tanstack/react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { findNeighbour } from "fumadocs-core/page-tree";
import { z } from "zod";

import { SPONSORS } from "@/lib/sponsors";
import { getGitHubStars } from "@/lib/github-stars";
import { getPageMarkdownUrl, source } from "@/lib/source";

export type DocsNeighbour = { url: string; name: string } | null;

function neighbourFrom(
  node: { url: string; name: unknown } | undefined,
): DocsNeighbour {
  if (!node) {
    return null;
  }

  return {
    url: node.url,
    name: typeof node.name === "string" ? node.name : node.url,
  };
}

export const getSerializedPageTree = createServerFn({ method: "GET" }).handler(
  async () => source.serializePageTree(source.getPageTree()),
);

export const getGitHubStarsFn = createServerFn({ method: "GET" }).handler(() =>
  getGitHubStars(),
);

export const getDocsPage = createServerFn({ method: "GET" })
  .validator(z.array(z.string()))
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) {
      return null;
    }

    const neighbours = findNeighbour(source.getPageTree(), page.url);

    return {
      path: page.path,
      markdownUrl: getPageMarkdownUrl(page).url,
      neighbours: {
        previous: neighbourFrom(neighbours.previous),
        next: neighbourFrom(neighbours.next),
      },
    };
  });

const COOKIE_KEY = "diamond-sponsor-id";

export const getDiamondSponsorFn = createServerFn({ method: "GET" }).handler(
  () => {
    const sponsors = SPONSORS.diamond;
    const stored = getCookie(COOKIE_KEY);
    const existing = sponsors.find(sponsor => sponsor.id === stored);

    if (existing) {
      return existing.id;
    }

    const picked = sponsors[Math.floor(Math.random() * sponsors.length)];
    setCookie(COOKIE_KEY, picked.id, { path: "/", sameSite: "lax" });
    return picked.id;
  },
);
