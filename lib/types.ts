export type ReadingLevel = "kid" | "general" | "expert";

export type ChaosMode = "off" | "shakespeare" | "caveman" | "linkedin" | "custom";

export type Persona = {
  level: ReadingLevel;
  freeform?: string;
  chaos: ChaosMode;
  chaosCustom?: string;
};

export type Referrer = {
  slug: string;
  body: string;
};

export type ArticleFrontmatter = {
  type: "article";
};

export type RejectedFrontmatter = {
  type: "rejected";
  reason?: string;
  suggestions?: string[];
};

export type Frontmatter = ArticleFrontmatter | RejectedFrontmatter;

export const HOME_SLUG = "__home__";
