/**
 * Twilio Integration Library
 *
 * Full-featured Twilio integration with Flex and TaskRouter support.
 * Provides SMS, WhatsApp, Voice, and contact center capabilities.
 *
 * Environment Variables:
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_PHONE_NUMBER: Your Twilio phone number for SMS/Voice
 * - TWILIO_WHATSAPP_NUMBER: Your Twilio WhatsApp number (optional)
 * - TWILIO_FLEX_INSTANCE_SID: Twilio Flex instance SID
 * - TWILIO_TASKROUTER_WORKSPACE_SID: TaskRouter workspace SID
 */

import { logger } from '@/lib/logger';
import { API_TIMEOUTS } from '@/lib/utils';

// ============================================================================
// Configuration
// ============================================================================

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  whatsappNumber?: string;
  flexInstanceSid?: string;
  taskRouterWorkspaceSid?: string;
}

export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    return null;
  }

  return {
    accountSid,
    authToken,
    phoneNumber,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
    flexInstanceSid: process.env.TWILIO_FLEX_INSTANCE_SID,
    taskRouterWorkspaceSid: process.env.TWILIO_TASKROUTER_WORKSPACE_SID,
  };
}

export function isTwilioConfigured(): boolean {
  return getTwilioConfig() !== null;
}

export function isFlexConfigured(): boolean {
  const config = getTwilioConfig();
  return !!(config?.flexInstanceSid && config?.taskRouterWorkspaceSid);
}

// ============================================================================
// Base API Client
// ============================================================================

async function twilioRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'DELETE';
    body?: Record<string, string>;
  } = {}
): Promise<T> {
  const config = getTwilioConfig();
  if (!config) {
    throw new Error('Twilio not configured');
  }

  const { method = 'GET', body } = options;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}${endpoint}`;

  const headers: HeadersInit = {
    Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
  };

  let requestBody: string | undefined;
  if (body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    requestBody = new URLSearchParams(body).toString();
  }

  const response = await fetch(url, {
    method,
    headers,
    body: requestBody,
    signal: AbortSignal.timeout(API_TIMEOUTS.TELEPHONY), // 10 second timeout
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    logger.error('Twilio API error', { endpoint, status: response.status, error });
    throw new Error(error.message || `Twilio API error: ${response.status}`);
  }

  return response.json();
}

// TaskRouter API client
async function taskRouterRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'DELETE';
    body?: Record<string, string>;
  } = {}
): Promise<T> {
  const config = getTwilioConfig();
  if (!config?.taskRouterWorkspaceSid) {
    throw new Error('TaskRouter not configured');
  }

  const { method = 'GET', body } = options;
  const url = `https://taskrouter.twilio.com/v1/Workspaces/${config.taskRouterWorkspaceSid}${endpoint}`;

  const headers: HeadersInit = {
    Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
  };

  let requestBody: string | undefined;
  if (body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    requestBody = new URLSearchParams(body).toString();
  }

  const response = await fetch(url, {
    method,
    headers,
    body: requestBody,
    signal: AbortSignal.timeout(API_TIMEOUTS.TELEPHONY), // 10 second timeout
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    logger.error('TaskRouter API error', { endpoint, status: response.status, error });
    throw new Error(error.message || `TaskRouter API error: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Messaging (SMS & WhatsApp)
// ============================================================================

export interface SendMessageParams {
  to: string;
  body: string;
  mediaUrl?: string;
  statusCallback?: string;
}

export interface TwilioMessage {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: string;
  dateSent: string | null;
  errorCode: number | null;
  errorMessage: string | null;
}

/**
 * Send an SMS message
 */
export async function sendSMS(params: SendMessageParams): Promise<TwilioMessage> {
  const config = getTwilioConfig();
  if (!config) throw new Error('Twilio not configured');

  const body: Record<string, string> = {
    From: config.phoneNumber,
    To: params.to,
    Body: params.body,
  };

  if (params.mediaUrl) {
    body.MediaUrl = params.mediaUrl;
  }

  if (params.statusCallback) {
    body.StatusCallback = params.statusCallback;
  }

  logger.info('Sending SMS', { to: params.to, bodyLength: params.body.length });

  return twilioRequest<TwilioMessage>('/Messages.json', {
    method: 'POST',
    body,
  });
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsApp(params: SendMessageParams): Promise<TwilioMessage> {
  const config = getTwilioConfig();
  if (!config) throw new Error('Twilio not configured');

  const fromNumber = config.whatsappNumber || `whatsapp:${config.phoneNumber}`;
  const toNumber = params.to.startsWith('whatsapp:') ? params.to : `whatsapp:${params.to}`;

  const body: Record<string, string> = {
    From: fromNumber,
    To: toNumber,
    Body: params.body,
  };

  if (params.mediaUrl) {
    body.MediaUrl = params.mediaUrl;
  }

  if (params.statusCallback) {
    body.StatusCallback = params.statusCallback;
  }

  logger.info('Sending WhatsApp', { to: params.to, bodyLength: params.body.length });

  return twilioRequest<TwilioMessage>('/Messages.json', {
    method: 'POST',
    body,
  });
}

/**
 * Get message status
 */
export async function getMessageStatus(messageSid: string): Promise<TwilioMessage> {
  return twilioRequest<TwilioMessage>(`/Messages/${messageSid}.json`);
}

// ============================================================================
// Voice Calls
// ============================================================================

export interface MakeCallParams {
  to: string;
  twiml?: string;
  url?: string;
  statusCallback?: string;
  record?: boolean;
  machineDetection?: 'Enable' | 'DetectMessageEnd';
}

export interface TwilioCall {
  sid: string;
  status: string;
  to: string;
  from: string;
  direction: string;
  duration: string | null;
  startTime: string | null;
  endTime: string | null;
}

/**
 * Initiate an outbound call
 */
export async function makeCall(params: MakeCallParams): Promise<TwilioCall> {
  const config = getTwilioConfig();
  if (!config) throw new Error('Twilio not configured');

  const body: Record<string, string> = {
    From: config.phoneNumber,
    To: params.to,
  };

  if (params.twiml) {
    body.Twiml = params.twiml;
  } else if (params.url) {
    body.Url = params.url;
  }

  if (params.statusCallback) {
    body.StatusCallback = params.statusCallback;
  }

  if (params.record) {
    body.Record = 'true';
  }

  if (params.machineDetection) {
    body.MachineDetection = params.machineDetection;
  }

  logger.info('Initiating call', { to: params.to });

  return twilioRequest<TwilioCall>('/Calls.json', {
    method: 'POST',
    body,
  });
}

/**
 * Get call details
 */
export async function getCallDetails(callSid: string): Promise<TwilioCall> {
  return twilioRequest<TwilioCall>(`/Calls/${callSid}.json`);
}

// ============================================================================
// TaskRouter (Flex Contact Center)
// ============================================================================

export interface TaskRouterWorker {
  sid: string;
  friendlyName: string;
  activityName: string;
  available: boolean;
  attributes: string;
}

export interface TaskRouterTask {
  sid: string;
  taskQueueFriendlyName: string;
  assignmentStatus: string;
  attributes: string;
  age: number;
  priority: number;
  reason: string | null;
}

export interface TaskRouterQueue {
  sid: string;
  friendlyName: string;
  taskOrder: string;
  targetWorkers: string;
}

export interface TaskRouterActivity {
  sid: string;
  friendlyName: string;
  available: boolean;
}

/**
 * List all workers in the workspace
 */
export async function listWorkers(): Promise<TaskRouterWorker[]> {
  interface WorkersResponse {
    workers: TaskRouterWorker[];
  }
  const response = await taskRouterRequest<WorkersResponse>('/Workers');
  return response.workers;
}

/**
 * Get worker by SID
 */
export async function getWorker(workerSid: string): Promise<TaskRouterWorker> {
  return taskRouterRequest<TaskRouterWorker>(`/Workers/${workerSid}`);
}

/**
 * Update worker activity (available, busy, offline, etc.)
 */
export async function updateWorkerActivity(
  workerSid: string,
  activitySid: string
): Promise<TaskRouterWorker> {
  return taskRouterRequest<TaskRouterWorker>(`/Workers/${workerSid}`, {
    method: 'POST',
    body: { ActivitySid: activitySid },
  });
}

/**
 * List all task queues
 */
export async function listTaskQueues(): Promise<TaskRouterQueue[]> {
  interface QueuesResponse {
    task_queues: TaskRouterQueue[];
  }
  const response = await taskRouterRequest<QueuesResponse>('/TaskQueues');
  return response.task_queues;
}

/**
 * List tasks in a queue
 */
export async function listTasks(options?: {
  assignmentStatus?: 'pending' | 'reserved' | 'assigned' | 'canceled' | 'completed' | 'wrapping';
  taskQueueSid?: string;
}): Promise<TaskRouterTask[]> {
  let endpoint = '/Tasks';
  const params = new URLSearchParams();

  if (options?.assignmentStatus) {
    params.append('AssignmentStatus', options.assignmentStatus);
  }
  if (options?.taskQueueSid) {
    params.append('TaskQueueSid', options.taskQueueSid);
  }

  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }

  interface TasksResponse {
    tasks: TaskRouterTask[];
  }
  const response = await taskRouterRequest<TasksResponse>(endpoint);
  return response.tasks;
}

/**
 * Create a new task (route a conversation to an agent)
 */
export async function createTask(params: {
  attributes: Record<string, unknown>;
  taskQueueSid?: string;
  workflowSid?: string;
  priority?: number;
  timeout?: number;
}): Promise<TaskRouterTask> {
  const body: Record<string, string> = {
    Attributes: JSON.stringify(params.attributes),
  };

  if (params.taskQueueSid) {
    body.TaskQueueSid = params.taskQueueSid;
  }
  if (params.workflowSid) {
    body.WorkflowSid = params.workflowSid;
  }
  if (params.priority !== undefined) {
    body.Priority = params.priority.toString();
  }
  if (params.timeout !== undefined) {
    body.Timeout = params.timeout.toString();
  }

  logger.info('Creating TaskRouter task', { attributes: params.attributes });

  return taskRouterRequest<TaskRouterTask>('/Tasks', {
    method: 'POST',
    body,
  });
}

/**
 * Complete a task
 */
export async function completeTask(taskSid: string, reason?: string): Promise<TaskRouterTask> {
  const body: Record<string, string> = {
    AssignmentStatus: 'completed',
  };

  if (reason) {
    body.Reason = reason;
  }

  return taskRouterRequest<TaskRouterTask>(`/Tasks/${taskSid}`, {
    method: 'POST',
    body,
  });
}

/**
 * List activities (worker states like Available, Offline, etc.)
 */
export async function listActivities(): Promise<TaskRouterActivity[]> {
  interface ActivitiesResponse {
    activities: TaskRouterActivity[];
  }
  const response = await taskRouterRequest<ActivitiesResponse>('/Activities');
  return response.activities;
}

// ============================================================================
// Workspace Statistics
// ============================================================================

export interface WorkspaceStats {
  realtime: {
    totalTasks: number;
    tasksByStatus: Record<string, number>;
    longestTaskWaitingAge: number;
    totalWorkers: number;
    activityStatistics: Array<{
      friendly_name: string;
      workers: number;
    }>;
  };
}

/**
 * Get real-time workspace statistics
 */
export async function getWorkspaceStats(): Promise<WorkspaceStats> {
  const config = getTwilioConfig();
  if (!config?.taskRouterWorkspaceSid) {
    throw new Error('TaskRouter not configured');
  }

  const url = `https://taskrouter.twilio.com/v1/Workspaces/${config.taskRouterWorkspaceSid}/Statistics`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
    },
    signal: AbortSignal.timeout(API_TIMEOUTS.TELEPHONY), // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(`Failed to get workspace stats: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Account Info & Status
// ============================================================================

export interface TwilioAccountInfo {
  sid: string;
  friendlyName: string;
  status: string;
  type: string;
  dateCreated: string;
}

/**
 * Get account information
 */
export async function getAccountInfo(): Promise<TwilioAccountInfo> {
  const config = getTwilioConfig();
  if (!config) throw new Error('Twilio not configured');

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}.json`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
      },
      signal: AbortSignal.timeout(API_TIMEOUTS.TELEPHONY), // 10 second timeout
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get account info: ${response.status}`);
  }

  return response.json();
}

/**
 * Verify Twilio credentials are valid
 */
export async function verifyCredentials(): Promise<boolean> {
  try {
    await getAccountInfo();
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // If it doesn't start with +, assume US and add +1
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
  }

  return cleaned;
}

/**
 * Parse delivery status from Twilio callback
 */
export function parseDeliveryStatus(
  twilioStatus: string
): 'pending' | 'sent' | 'delivered' | 'failed' | 'undelivered' {
  switch (twilioStatus.toLowerCase()) {
    case 'queued':
    case 'accepted':
    case 'sending':
      return 'pending';
    case 'sent':
      return 'sent';
    case 'delivered':
    case 'read':
      return 'delivered';
    case 'failed':
      return 'failed';
    case 'undelivered':
      return 'undelivered';
    default:
      return 'pending';
  }
}

/**
 * Generate TwiML for common scenarios
 */
export const TwiML = {
  /**
   * Say a message and hang up
   */
  say(message: string, voice: string = 'alice'): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${message}</Say>
</Response>`;
  },

  /**
   * Play a message, then record
   */
  voicemail(greeting: string, recordingCallback: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${greeting}</Say>
  <Record maxLength="120" action="${recordingCallback}" transcribe="true" />
  <Say voice="alice">I did not receive a recording. Goodbye.</Say>
</Response>`;
  },

  /**
   * Forward call to another number
   */
  forward(phoneNumber: string, callerId?: string): string {
    const callerIdAttr = callerId ? ` callerId="${callerId}"` : '';
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial${callerIdAttr}>${phoneNumber}</Dial>
</Response>`;
  },

  /**
   * IVR menu
   */
  menu(options: { message: string; gatherUrl: string; numDigits?: number }): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="${options.numDigits || 1}" action="${options.gatherUrl}">
    <Say voice="alice">${options.message}</Say>
  </Gather>
  <Say voice="alice">We didn't receive any input. Goodbye!</Say>
</Response>`;
  },
};
