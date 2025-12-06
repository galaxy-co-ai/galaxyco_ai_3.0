import { pgTable, uuid, varchar, text, jsonb, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { workspaces } from './schema';

// Workflows table
export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, active, paused, archived
  trigger: jsonb('trigger'), // Trigger configuration
  nodes: jsonb('nodes').notNull(), // Array of workflow nodes
  edges: jsonb('edges').notNull(), // Array of connections between nodes
  version: integer('version').notNull().default(1),
  isTemplate: boolean('is_template').notNull().default(false),
  executionCount: integer('execution_count').notNull().default(0),
  lastExecutedAt: timestamp('last_executed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
});

// Workflow executions table
export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('running'), // running, completed, failed, cancelled
  trigger: jsonb('trigger'), // What triggered this execution
  input: jsonb('input'), // Input data
  output: jsonb('output'), // Final output
  error: text('error'), // Error message if failed
  nodeExecutions: jsonb('node_executions'), // Array of individual node execution results
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // Duration in milliseconds
});




































