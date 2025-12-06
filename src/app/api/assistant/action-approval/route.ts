/**
 * Action Approval API
 * 
 * Allows users to approve or reject Neptune actions for learning
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { recordActionExecution } from '@/lib/ai/autonomy-learning';
import { executeTool, type ToolContext } from '@/lib/ai/tools';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const approvalSchema = z.object({
  toolName: z.string(),
  args: z.record(z.unknown()),
  approved: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const { workspaceId, userId: clerkUserId } = await getCurrentWorkspace();
    const currentUser = await getCurrentUser();

    const body = await request.json();
    const validationResult = approvalSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { toolName, args, approved } = validationResult.data;

    const toolContext: ToolContext = {
      workspaceId,
      userId: currentUser.id,
      userEmail: currentUser.email || '',
      userName: currentUser.firstName || currentUser.email?.split('@')[0] || 'User',
    };

    if (approved) {
      // Execute the action
      const startTime = Date.now();
      const result = await executeTool(toolName, args, toolContext);
      const executionTime = Date.now() - startTime;

      // Record for learning
      await recordActionExecution(
        workspaceId,
        currentUser.id,
        toolName,
        false, // wasAutomatic (user approved manually)
        true,  // userApproved
        executionTime,
        result.success ? 'success' : 'failed'
      );

      return NextResponse.json({
        success: true,
        message: 'Action executed successfully',
        result,
      });
    } else {
      // Record rejection for learning
      await recordActionExecution(
        workspaceId,
        currentUser.id,
        toolName,
        false, // wasAutomatic
        false, // userApproved
        0,
        'pending'
      );

      return NextResponse.json({
        success: true,
        message: 'Action rejected - learning updated',
      });
    }
  } catch (error) {
    logger.error('Action approval failed', error);
    return NextResponse.json(
      { error: 'Failed to process action approval' },
      { status: 500 }
    );
  }
}
