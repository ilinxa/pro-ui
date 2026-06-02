import { MediaEditor01 } from "./media-editor-01";
import { MEDIA_EDITOR_01_DUMMY } from "./dummy-data";

export default function MediaEditor01Demo() {
  return (
    <MediaEditor01
      title={MEDIA_EDITOR_01_DUMMY.title}
      description={MEDIA_EDITOR_01_DUMMY.description}
    />
  );
}
