import { describe, it, expect } from "vitest";
import {
  getQueueNameForTier,
  getConcurrencyLimitForTier,
  buildWorkspaceQueueOptions,
  type WorkspaceTier,
} from "../queues";

describe("Queue Selection", () => {
  describe("getQueueNameForTier", () => {
    it("returns free-tier for free workspaces", () => {
      expect(getQueueNameForTier("free")).toBe("free-tier");
    });

    it("returns standard-tier for starter workspaces", () => {
      expect(getQueueNameForTier("starter")).toBe("standard-tier");
    });

    it("returns standard-tier for standard workspaces", () => {
      expect(getQueueNameForTier("standard")).toBe("standard-tier");
    });

    it("returns enterprise-tier for professional workspaces", () => {
      expect(getQueueNameForTier("professional")).toBe("enterprise-tier");
    });

    it("returns enterprise-tier for enterprise workspaces", () => {
      expect(getQueueNameForTier("enterprise")).toBe("enterprise-tier");
    });

    it("returns free-tier for unknown tiers", () => {
      // @ts-expect-error - Testing unknown tier fallback
      expect(getQueueNameForTier("unknown")).toBe("free-tier");
    });
  });

  describe("getConcurrencyLimitForTier", () => {
    it("returns 1 for free tier", () => {
      expect(getConcurrencyLimitForTier("free")).toBe(1);
    });

    it("returns 5 for starter tier", () => {
      expect(getConcurrencyLimitForTier("starter")).toBe(5);
    });

    it("returns 5 for standard tier", () => {
      expect(getConcurrencyLimitForTier("standard")).toBe(5);
    });

    it("returns 20 for professional tier", () => {
      expect(getConcurrencyLimitForTier("professional")).toBe(20);
    });

    it("returns 20 for enterprise tier", () => {
      expect(getConcurrencyLimitForTier("enterprise")).toBe(20);
    });

    it("returns 1 for unknown tiers", () => {
      // @ts-expect-error - Testing unknown tier fallback
      expect(getConcurrencyLimitForTier("unknown")).toBe(1);
    });
  });

  describe("buildWorkspaceQueueOptions", () => {
    const workspaceId = "ws_test_123";

    it("builds correct options for free tier", () => {
      const options = buildWorkspaceQueueOptions(workspaceId, "free");
      expect(options).toEqual({
        queue: "free-tier",
        concurrencyKey: workspaceId,
      });
    });

    it("builds correct options for standard tier", () => {
      const options = buildWorkspaceQueueOptions(workspaceId, "standard");
      expect(options).toEqual({
        queue: "standard-tier",
        concurrencyKey: workspaceId,
      });
    });

    it("builds correct options for enterprise tier", () => {
      const options = buildWorkspaceQueueOptions(workspaceId, "enterprise");
      expect(options).toEqual({
        queue: "enterprise-tier",
        concurrencyKey: workspaceId,
      });
    });

    it("uses workspaceId as concurrency key", () => {
      const tiers: WorkspaceTier[] = ["free", "starter", "standard", "professional", "enterprise"];
      
      for (const tier of tiers) {
        const options = buildWorkspaceQueueOptions(workspaceId, tier);
        expect(options.concurrencyKey).toBe(workspaceId);
      }
    });
  });
});
