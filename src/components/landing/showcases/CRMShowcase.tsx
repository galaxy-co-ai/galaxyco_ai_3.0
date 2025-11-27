import { DemoWrapper } from "../../shared/DemoWrapper";
import CRM from "@/legacy-pages/CRM";

export function CRMShowcase() {
  return (
    <DemoWrapper scale={0.6} height={600} needsSidebar={false}>
      <CRM />
    </DemoWrapper>
  );
}
