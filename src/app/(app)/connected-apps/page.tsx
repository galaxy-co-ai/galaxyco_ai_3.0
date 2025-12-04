import { GalaxyIntegrations } from "@/components/integrations/GalaxyIntegrations";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connectors | GalaxyCo.ai",
  description: "Connect and manage third-party integrations",
};

export default function IntegrationsPage() {
  return <GalaxyIntegrations />;
}
