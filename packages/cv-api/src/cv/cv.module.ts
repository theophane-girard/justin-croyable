import { cvContract, type Cv } from '@justin-croyable/cv-contract';
import { Controller, Injectable, Module } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

import { ExperienceModule, ExperienceService } from '../experiences/experience.module';
import { ProfileModule, ProfileService } from '../profile/profile.module';
import { SkillModule, SkillService } from '../skills/skill.module';
import { TagModule, TagService } from '../tags/tag.module';

@Injectable()
export class CvService {
  constructor(
    private readonly profiles: ProfileService,
    private readonly experiences: ExperienceService,
    private readonly skills: SkillService,
    private readonly tags: TagService,
  ) {}

  async get(): Promise<Cv> {
    const [profile, experiences, skills, tags] = await Promise.all([
      this.profiles.get(),
      this.experiences.list({}),
      this.skills.list({}),
      this.tags.list({}),
    ]);
    return { profile, experiences, skills, tags };
  }
}

@Controller()
export class CvController {
  constructor(private readonly cv: CvService) {}

  @TsRestHandler(cvContract)
  async handler() {
    return tsRestHandler(cvContract, {
      get: async () => ({ status: 200, body: await this.cv.get() }),
    });
  }
}

@Module({
  imports: [ProfileModule, ExperienceModule, SkillModule, TagModule],
  controllers: [CvController],
  providers: [CvService],
})
export class CvModule {}
