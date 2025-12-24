import { describe, it, expect } from "vitest";
import type {
  STREAMS,
  OpenAIStreamPart,
  ToolExecutionPart,
  CampaignProgressPart,
  BatchProgressPart,
} from "../streams";

describe("Stream Types", () => {
  describe("STREAMS type", () => {
    it("has openai key for AI streaming", () => {
      // Type assertion test - if this compiles, the type is correct
      const streams: Partial<STREAMS> = {};
      const openaiChunk: OpenAIStreamPart | undefined = streams.openai;
      expect(openaiChunk).toBeUndefined();
    });

    it("has tools key for tool execution events", () => {
      const streams: Partial<STREAMS> = {};
      const toolEvent: ToolExecutionPart | undefined = streams.tools;
      expect(toolEvent).toBeUndefined();
    });

    it("has campaign-progress key for campaign updates", () => {
      const streams: Partial<STREAMS> = {};
      const progress: CampaignProgressPart | undefined = streams["campaign-progress"];
      expect(progress).toBeUndefined();
    });

    it("has batch-progress key for batch operations", () => {
      const streams: Partial<STREAMS> = {};
      const progress: BatchProgressPart | undefined = streams["batch-progress"];
      expect(progress).toBeUndefined();
    });
  });

  describe("ToolExecutionPart", () => {
    it("accepts tool_start type", () => {
      const event: ToolExecutionPart = {
        type: "tool_start",
        toolName: "search_leads",
        args: { query: "test" },
        timestamp: new Date().toISOString(),
      };
      expect(event.type).toBe("tool_start");
      expect(event.toolName).toBe("search_leads");
    });

    it("accepts tool_complete type with result", () => {
      const event: ToolExecutionPart = {
        type: "tool_complete",
        toolName: "search_leads",
        result: { leads: [] },
        timestamp: new Date().toISOString(),
      };
      expect(event.type).toBe("tool_complete");
      expect(event.result).toEqual({ leads: [] });
    });

    it("accepts tool_error type with error message", () => {
      const event: ToolExecutionPart = {
        type: "tool_error",
        toolName: "search_leads",
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
      };
      expect(event.type).toBe("tool_error");
      expect(event.error).toBe("Database connection failed");
    });
  });

  describe("CampaignProgressPart", () => {
    it("tracks campaign sending progress", () => {
      const progress: CampaignProgressPart = {
        sent: 50,
        failed: 2,
        total: 100,
        currentBatch: 3,
        complete: false,
      };
      expect(progress.sent).toBe(50);
      expect(progress.failed).toBe(2);
      expect(progress.total).toBe(100);
      expect(progress.complete).toBe(false);
    });

    it("can represent completed campaign", () => {
      const progress: CampaignProgressPart = {
        sent: 98,
        failed: 2,
        total: 100,
        currentBatch: 10,
        complete: true,
      };
      expect(progress.complete).toBe(true);
      expect(progress.sent + progress.failed).toBe(progress.total);
    });
  });

  describe("BatchProgressPart", () => {
    it("tracks batch operation progress", () => {
      const progress: BatchProgressPart = {
        operation: "lead-scoring",
        processed: 25,
        total: 100,
        currentItem: "lead_123",
        complete: false,
        errors: [],
      };
      expect(progress.operation).toBe("lead-scoring");
      expect(progress.processed).toBe(25);
      expect(progress.complete).toBe(false);
    });

    it("can track errors during batch operation", () => {
      const progress: BatchProgressPart = {
        operation: "document-indexing",
        processed: 50,
        total: 100,
        complete: false,
        errors: ["Failed to index doc_1", "Failed to index doc_2"],
      };
      expect(progress.errors).toHaveLength(2);
      expect(progress.errors[0]).toContain("doc_1");
    });
  });
});
