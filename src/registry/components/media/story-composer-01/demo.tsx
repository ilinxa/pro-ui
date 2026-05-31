import { StoryComposer01 } from "./story-composer-01";
import { STORY_COMPOSER_01_DUMMY } from "./dummy-data";

export default function StoryComposer01Demo() {
  return (
    <StoryComposer01
      title={STORY_COMPOSER_01_DUMMY.title}
      description={STORY_COMPOSER_01_DUMMY.description}
    />
  );
}
