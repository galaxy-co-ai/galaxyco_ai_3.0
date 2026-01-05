'use client';

/**
 * Mission Control - Agent Builder UI
 * 
 * Admin interface for:
 * - Importing n8n workflows from local dev
 * - Configuring agent templates
 * - Deploying to production cloud n8n
 * - Managing agent availability for users
 */

import { useState } from 'react';
import { Upload, Rocket, Settings, Eye, Play, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  n8nWorkflowId?: string;
  localWorkflowData?: Record<string, unknown>;
  deployedToProduction: boolean;
  availableToUsers: boolean;
  usageCount: number;
  createdAt: string;
}

export function MissionControlClient() {
  const [agents, setAgents] = useState<AgentTemplate[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentTemplate | null>(null);

  // Handle importing workflow JSON from local n8n
  const handleImportWorkflow = async (file: File) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const workflowData = JSON.parse(text);
      
      // Create new agent template from workflow
      const newAgent: AgentTemplate = {
        id: `agent_${Date.now()}`,
        name: workflowData.name || 'Unnamed Agent',
        description: workflowData.notes || 'No description',
        category: 'custom',
        localWorkflowData: workflowData,
        deployedToProduction: false,
        availableToUsers: false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
      };
      
      setAgents([...agents, newAgent]);
      setSelectedAgent(newAgent);
    } catch (error) {
      console.error('Failed to import workflow:', error);
      alert('Failed to import workflow. Make sure it\'s a valid n8n workflow JSON file.');
    } finally {
      setIsImporting(false);
    }
  };

  // Deploy agent to production cloud n8n
  const handleDeployToProduction = async (agent: AgentTemplate) => {
    try {
      const response = await fetch('/api/admin/agents/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          workflowData: agent.localWorkflowData,
        }),
      });
      
      if (!response.ok) throw new Error('Deploy failed');
      
      const { workflowId } = await response.json();
      
      // Update agent with production workflow ID
      setAgents(agents.map(a => 
        a.id === agent.id 
          ? { ...a, n8nWorkflowId: workflowId, deployedToProduction: true }
          : a
      ));
      
      alert('Agent deployed to production successfully!');
    } catch (error) {
      console.error('Deploy failed:', error);
      alert('Failed to deploy agent to production.');
    }
  };

  // Make agent available to users
  const toggleAvailability = async (agent: AgentTemplate) => {
    if (!agent.deployedToProduction) {
      alert('Please deploy to production first');
      return;
    }
    
    try {
      await fetch('/api/admin/agents/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          available: !agent.availableToUsers,
        }),
      });
      
      setAgents(agents.map(a => 
        a.id === agent.id 
          ? { ...a, availableToUsers: !a.availableToUsers }
          : a
      ));
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Mission Control</h1>
              <p className="text-muted-foreground mt-1">
                Build agents locally, deploy to production
              </p>
            </div>
            
            <div className="flex gap-2">
              <label htmlFor="workflow-import">
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  disabled={isImporting}
                  asChild
                >
                  <div>
                    <Upload className="h-4 w-4 mr-2" />
                    {isImporting ? 'Importing...' : 'Import from Local n8n'}
                  </div>
                </Button>
                <input
                  id="workflow-import"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportWorkflow(file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Workflow Section */}
          <Card className="mb-6 p-6">
            <h2 className="text-lg font-semibold mb-4">Development Workflow</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                  <Settings className="h-6 w-6 text-blue-500" />
                </div>
                <p className="font-medium">Build Locally</p>
                <p className="text-sm text-muted-foreground">n8n Desktop App</p>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="w-8 h-0.5 bg-border" />
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                  <Upload className="h-6 w-6 text-purple-500" />
                </div>
                <p className="font-medium">Import Here</p>
                <p className="text-sm text-muted-foreground">Mission Control</p>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="w-8 h-0.5 bg-border" />
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                  <Rocket className="h-6 w-6 text-green-500" />
                </div>
                <p className="font-medium">Deploy Live</p>
                <p className="text-sm text-muted-foreground">Cloud n8n</p>
              </div>
            </div>
          </Card>

          {/* Agent Templates List */}
          {agents.length === 0 ? (
            <Card className="p-12 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No agents yet</h3>
              <p className="text-muted-foreground mb-4">
                Build an agent in your local n8n desktop app, then import it here
              </p>
              <label htmlFor="workflow-import-empty">
                <Button asChild>
                  <div>Import Your First Agent</div>
                </Button>
                <input
                  id="workflow-import-empty"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportWorkflow(file);
                  }}
                />
              </label>
            </Card>
          ) : (
            <div className="grid gap-4">
              {agents.map(agent => (
                <Card key={agent.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{agent.name}</h3>
                        {agent.deployedToProduction && (
                          <Badge variant="default" className="bg-green-500">
                            <Rocket className="h-3 w-3 mr-1" />
                            Live
                          </Badge>
                        )}
                        {agent.availableToUsers && (
                          <Badge variant="secondary">
                            Public
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-4">{agent.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Usage:</span> {agent.usageCount} times
                        </div>
                        <div>
                          <span className="font-medium">Workflow ID:</span> {agent.n8nWorkflowId || 'Not deployed'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {!agent.deployedToProduction ? (
                        <Button
                          variant="default"
                          onClick={() => handleDeployToProduction(agent)}
                        >
                          <Rocket className="h-4 w-4 mr-2" />
                          Deploy to Production
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => toggleAvailability(agent)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {agent.availableToUsers ? 'Make Private' : 'Make Public'}
                          </Button>
                          <Button variant="outline" size="icon">
                            <Play className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
