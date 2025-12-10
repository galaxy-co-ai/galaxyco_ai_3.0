import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Play, Zap, Mail, Clock, Check, GitBranch } from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  label: string;
  icon: any;
  status?: 'idle' | 'running' | 'complete';
}

export function WorkflowBuilderDemo() {
  const [step, setStep] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: '1', type: 'trigger', label: 'New Contact Created', icon: Zap, status: 'idle' },
  ]);

  const handleAddAction = (actionType: 'email' | 'delay' | 'condition') => {
    const newNodes: WorkflowNode[] = [...nodes];
    
    if (actionType === 'email') {
      newNodes.push({ 
        id: '2', 
        type: 'action', 
        label: 'Send Welcome Email', 
        icon: Mail, 
        status: 'idle' 
      });
      toast.success('Email action added!');
      setStep(2);
    } else if (actionType === 'delay') {
      newNodes.push({ 
        id: '3', 
        type: 'action', 
        label: 'Wait 2 Days', 
        icon: Clock, 
        status: 'idle' 
      });
      toast.success('Delay added!');
    } else if (actionType === 'condition') {
      newNodes.push({ 
        id: '4', 
        type: 'condition', 
        label: 'If Email Opened', 
        icon: GitBranch, 
        status: 'idle' 
      });
      toast.success('Condition added!');
    }
    
    setNodes(newNodes);
  };

  const handleTestRun = () => {
    setIsRunning(true);
    toast.loading('Running workflow test...', { id: 'test-run' });

    // Simulate step-by-step execution
    nodes.forEach((node, index) => {
      setTimeout(() => {
        setNodes(prev => prev.map((n, i) => 
          i === index ? { ...n, status: 'running' } : n
        ));
      }, index * 1000);

      setTimeout(() => {
        setNodes(prev => prev.map((n, i) => 
          i === index ? { ...n, status: 'complete' } : n
        ));
        
        if (index === nodes.length - 1) {
          toast.success('Workflow test complete!', { id: 'test-run' });
          setIsRunning(false);
          setStep(3);
        }
      }, (index + 1) * 1000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Guide Steps */}
      <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
            1
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
            2
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
            3
          </div>
        </div>
        <Badge variant="outline" className="bg-purple-500/10">
          Guided Demo
        </Badge>
      </div>

      {/* Visual Workflow Builder */}
      <Card className="p-6 border-purple-500/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg">Welcome Email Workflow</h3>
          </div>
          <Badge variant="outline">Draft</Badge>
        </div>

        {/* Workflow Nodes */}
        <div className="space-y-4 mb-6">
          {nodes.map((node, index) => (
            <div key={node.id}>
              <div className={`p-4 rounded-lg border ${
                node.status === 'running' ? 'border-blue-500 bg-blue-500/10' :
                node.status === 'complete' ? 'border-green-500 bg-green-500/10' :
                node.type === 'trigger' ? 'border-purple-500/40 bg-purple-500/10' :
                'border-gray-700 bg-gray-800/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      node.type === 'trigger' ? 'bg-purple-500/20' :
                      node.type === 'action' ? 'bg-blue-500/20' :
                      'bg-yellow-500/20'
                    }`}>
                      <node.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 uppercase">{node.type}</div>
                      <div>{node.label}</div>
                    </div>
                  </div>
                  {node.status === 'complete' && (
                    <Check className="w-5 h-5 text-green-400" />
                  )}
                  {node.status === 'running' && (
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
              
              {index < nodes.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="w-0.5 h-6 bg-gray-700" />
                </div>
              )}
            </div>
          ))}

          {/* Add Node Button */}
          {step === 1 && (
            <div className="flex justify-center py-2">
              <Button
                variant="outline"
                size="sm"
                className="border-dashed"
                onClick={() => {
                  // Show add menu
                }}
              >
                + Add Action
              </Button>
            </div>
          )}
        </div>

        {/* Action Buttons Based on Step */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400 mb-3">Step 1: Add an action to your workflow</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddAction('email')}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddAction('delay')}
                  className="flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Add Delay
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddAction('condition')}
                  className="flex items-center gap-2"
                >
                  <GitBranch className="w-4 h-4" />
                  Add Condition
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400 mb-3">Step 2: Test your workflow with sample data</p>
              <Button onClick={handleTestRun} disabled={isRunning} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Test Run Workflow
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400 mb-3">✓ Test successful! Your workflow is ready to publish.</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => {
                  setNodes(nodes.map(n => ({ ...n, status: 'idle' })));
                  setStep(2);
                }}>
                  Test Again
                </Button>
                <Button className="flex-1" onClick={() => {
                  toast.success('Workflow published and activated!');
                }}>
                  Publish Workflow
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Complete State */}
      {step === 3 && (
        <Card className="p-6 border-green-500/20 bg-green-500/5">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl mb-2">🎉 Workflow Built!</h3>
              <p className="text-gray-400">You've learned how to:</p>
              <ul className="text-sm text-gray-400 mt-2 space-y-1">
                <li>✓ Create workflow triggers</li>
                <li>✓ Add actions and conditions</li>
                <li>✓ Test workflows before publishing</li>
                <li>✓ Deploy automation to production</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-sm">
                <span className="text-purple-400">This workflow will run automatically</span> whenever a new contact is created, saving you hours of manual follow-up work.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => {
                setStep(1);
                setNodes([{ id: '1', type: 'trigger', label: 'New Contact Created', icon: Zap, status: 'idle' }]);
              }}>
                Build Another
              </Button>
              <Button>Go to Studio</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
