import { DemoWrapper } from "../../shared/DemoWrapper";
import { KnowledgeBase } from "../../../pages/KnowledgeBase";

export function KnowledgeShowcase() {
  return (
    <DemoWrapper scale={0.6} height={600} needsSidebar={false}>
      <KnowledgeBase />
    </DemoWrapper>
  );
}
