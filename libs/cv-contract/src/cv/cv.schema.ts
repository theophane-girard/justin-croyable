import { z } from 'zod';

import { experienceSchema } from '../experience/experience.schema';
import { profileSchema } from '../profile/profile.schema';
import { skillSchema } from '../skill/skill.schema';
import { tagSchema } from '../tag/tag.schema';

export const cvSchema = z.object({
  profile: profileSchema.nullable(),
  experiences: z.array(experienceSchema),
  skills: z.array(skillSchema),
  tags: z.array(tagSchema),
});

export type Cv = z.infer<typeof cvSchema>;
