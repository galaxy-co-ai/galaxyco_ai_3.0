/**
 * Deploy Agent to Production Cloud n8n
 * 
 * Takes a workflow JSON from local development and deploys it
 * to the production n8n cloud instance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // TODO: Add admin check
    // const isAdmin = await checkIsAdmin(userId);
    // if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    
    const { agentId, workflowData } = await req.json();
    
    if (!agentId || !workflowData) {
      return NextResponse.json(
        { error: 'Missing agentId or workflowData' },
        { status: 400 }
      );
    }
    
    // Get n8n API credentials
    const n8nApiUrl = process.env.N8N_API_URL;
    const n8nApiKey = process.env.N8N_API_KEY;
    
    if (!n8nApiUrl || !n8nApiKey) {
      logger.error('N8N credentials not configured');
      return NextResponse.json(
        { error: 'N8N not configured on server' },
        { status: 500 }
      );
    }
    
    logger.info('Deploying workflow to production n8n', {
      agentId,
      workflowName: workflowData.name,
    });
    
    // Create workflow in production n8n
    const response = await fetch(`${n8nApiUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': n8nApiKey,
      },
      body: JSON.stringify(workflowData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to create workflow in n8n', {
        status: response.status,
        error: errorText,
      });
      
      return NextResponse.json(
        { error: 'Failed to deploy to n8n', details: errorText },
        { status: 500 }
      );
    }
    
    const createdWorkflow = await response.json();
    
    logger.info('Workflow deployed successfully', {
      agentId,
      workflowId: createdWorkflow.id,
    });
    
    // TODO: Save to database
    // await db.insert(agentTemplates).values({
    //   id: agentId,
    //   n8nWorkflowId: createdWorkflow.id,
    //   deployedToProduction: true,
    //   deployedAt: new Date(),
    //   deployedBy: userId,
    // });
    
    return NextResponse.json({
      success: true,
      workflowId: createdWorkflow.id,
      workflowName: createdWorkflow.name,
    });
  } catch (error) {
    logger.error('Deploy agent error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
