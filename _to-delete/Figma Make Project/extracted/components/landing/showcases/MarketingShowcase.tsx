import { DemoWrapper } from "../../shared/DemoWrapper";
import { Marketing } from "../../../pages/Marketing";

export function MarketingShowcase() {
  return (
    <DemoWrapper scale={0.6} height={600} needsSidebar={false}>
      <Marketing />
    </DemoWrapper>
  );
}
