export type ContactLink = {
  readonly label: string;
  readonly value: string;
  readonly href: string;
  readonly icon: string;
};

export type Experience = {
  readonly role: string;
  readonly company: string;
  readonly period: string;
  readonly location: string;
  readonly summary: string;
  readonly highlights: readonly string[];
};

export type Education = {
  readonly degree: string;
  readonly school: string;
  readonly period: string;
};

export type SkillGroup = {
  readonly title: string;
  readonly items: readonly string[];
};

export type LanguageSkill = {
  readonly name: string;
  readonly level: string;
};

export type Resume = {
  readonly fullName: string;
  readonly title: string;
  readonly initials: string;
  readonly summary: string;
  readonly contacts: readonly ContactLink[];
  readonly experiences: readonly Experience[];
  readonly education: readonly Education[];
  readonly skillGroups: readonly SkillGroup[];
  readonly languages: readonly LanguageSkill[];
};
