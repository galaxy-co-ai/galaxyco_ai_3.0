import { task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { knowledgeItems } from "@/db/schema";
import { eq, and, isNull, or } from "drizzle-orm";
import { indexKnowledgeDocument, isVectorConfigured } from "@/lib/vector";
import { logger } from "@/lib/logger";

/**
 * Index Single Document Task
 * Indexes a single knowledge base document in the vector database
 */
export const indexDocumentTask = task({
  id: "index-document",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: { itemId: string; workspaceId: string }) => {
    const { itemId, workspaceId } = payload;

    if (!isVectorConfigured()) {
      return { success: false, error: "Vector database not configured" };
    }

    // Get the document
    const item = await db.query.knowledgeItems.findFirst({
      where: and(
        eq(knowledgeItems.id, itemId),
        eq(knowledgeItems.workspaceId, workspaceId)
      ),
    });

    if (!item) {
      return { success: false, error: "Document not found" };
    }

    if (!item.content || item.content.trim().length === 0) {
      return { success: false, error: "Document has no content to index" };
    }

    try {
      const { chunksIndexed } = await indexKnowledgeDocument(
        item.id,
        workspaceId,
        item.title,
        item.content,
        {
          type: item.type,
          mimeType: item.mimeType,
          fileName: item.fileName,
        }
      );

      // Update the item to mark as indexed
      // Store indexing info in the status field since metadata has a specific type
      await db
        .update(knowledgeItems)
        .set({
          status: "ready",
          updatedAt: new Date(),
        })
        .where(eq(knowledgeItems.id, itemId));

      logger.info("Document indexed", { itemId, workspaceId, chunksIndexed });

      return { success: true, itemId, chunksIndexed };
    } catch (error) {
      logger.error("Document indexing failed", {
        itemId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Bulk Index Documents Task
 * Indexes all unindexed documents in a workspace
 */
export const bulkIndexDocumentsTask = task({
  id: "bulk-index-documents",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: { workspaceId: string; force?: boolean }) => {
    const { workspaceId, force = false } = payload;

    if (!isVectorConfigured()) {
      return { success: false, error: "Vector database not configured" };
    }

    // Get all documents that need indexing
    const documents = await db.query.knowledgeItems.findMany({
      where: eq(knowledgeItems.workspaceId, workspaceId),
      columns: {
        id: true,
        title: true,
        content: true,
        metadata: true,
      },
    });

    // Filter to only unindexed documents (unless force is true)
    const docsToIndex = force
      ? documents
      : documents.filter((doc) => {
          const metadata = doc.metadata as Record<string, unknown> | null;
          return !metadata?.vectorIndexedAt;
        });

    // Filter out documents without content
    const validDocs = docsToIndex.filter(
      (doc) => doc.content && doc.content.trim().length > 0
    );

    logger.info("Bulk indexing documents", {
      workspaceId,
      total: documents.length,
      toIndex: validDocs.length,
      force,
    });

    if (validDocs.length === 0) {
      return {
        success: true,
        message: "No documents to index",
        processed: 0,
      };
    }

    // Trigger individual indexing tasks
    const results = await Promise.all(
      validDocs.map((doc) =>
        indexDocumentTask.trigger({
          itemId: doc.id,
          workspaceId,
        })
      )
    );

    return {
      success: true,
      processed: validDocs.length,
      taskIds: results.map((r) => r.id),
    };
  },
});

/**
 * Reindex All Documents Task
 * Forces re-indexing of all documents in a workspace
 * Useful after vector index changes or migrations
 */
export const reindexAllDocumentsTask = task({
  id: "reindex-all-documents",
  retry: {
    maxAttempts: 1, // Don't retry full reindex
  },
  run: async (payload: { workspaceId: string }) => {
    const { workspaceId } = payload;

    logger.info("Starting full reindex", { workspaceId });

    const result = await bulkIndexDocumentsTask.triggerAndWait({
      workspaceId,
      force: true,
    });

    return result;
  },
});

