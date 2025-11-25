import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { User, Mail, Phone, Building2, Calendar, TrendingUp, Star } from 'lucide-react';
import { toast } from 'sonner';

export function CRMContactDemo() {
  const [step, setStep] = useState(1);
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    phone: ''
  });
  const [leadScore, setLeadScore] = useState(0);

  const handleCreateContact = () => {
    if (!contactData.name || !contactData.email) {
      toast.error('Please enter name and email');
      return;
    }
    
    // Simulate AI enrichment
    setTimeout(() => {
      const score = Math.floor(Math.random() * 40) + 60; // 60-100
      setLeadScore(score);
      setStep(2);
      toast.success('Contact created and enriched with AI!');
    }, 1500);
  };

  const handleEnableScoring = () => {
    toast.success('AI Lead Scoring enabled for all contacts!', {
      description: 'Scores will update automatically based on engagement.'
    });
    setStep(3);
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

      {/* Step 1: Create Contact */}
      {step === 1 && (
        <Card className="p-6 space-y-4 border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg">Step 1: Create a Contact</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Full Name *</label>
              <Input
                placeholder="Sarah Johnson"
                value={contactData.name}
                onChange={(e) => setContactData({...contactData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Email *</label>
              <Input
                type="email"
                placeholder="sarah@company.com"
                value={contactData.email}
                onChange={(e) => setContactData({...contactData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Company</label>
              <Input
                placeholder="Acme Corp"
                value={contactData.company}
                onChange={(e) => setContactData({...contactData, company: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Role</label>
              <Input
                placeholder="VP of Sales"
                value={contactData.role}
                onChange={(e) => setContactData({...contactData, role: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Phone</label>
              <Input
                placeholder="+1 (555) 123-4567"
                value={contactData.phone}
                onChange={(e) => setContactData({...contactData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-blue-400">AI will auto-enrich this contact with company data and social profiles</p>
          </div>

          <Button onClick={handleCreateContact} className="w-full">
            Create Contact & AI Enrich
          </Button>
        </Card>
      )}

      {/* Step 2: View Enriched Contact */}
      {step === 2 && (
        <Card className="p-6 border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg">Step 2: AI-Enriched Contact</h3>
          </div>

          <div className="flex items-start gap-6 mb-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-purple-500/20 text-2xl">
                {contactData.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl mb-1">{contactData.name}</h3>
                <p className="text-gray-400">{contactData.role || 'VP of Sales'} at {contactData.company || 'Acme Corp'}</p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{contactData.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{contactData.phone || '+1 (555) 123-4567'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Mid-Market SaaS • 150-500 employees</span>
                <Badge variant="outline" className="ml-2">Qualified Lead</Badge>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-400">Lead Score:</div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-500 to-green-500"
                        style={{ width: `${leadScore}%` }}
                      />
                    </div>
                    <span className="text-green-400">{leadScore}/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="deals">Deals</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="space-y-3 pt-4">
              <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded">
                <Calendar className="w-4 h-4 text-blue-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm">Contact created and enriched</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded">
                <Mail className="w-4 h-4 text-purple-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm">Opened email: Product Demo Invitation</p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="notes" className="pt-4">
              <p className="text-sm text-gray-400">No notes yet. Add your first note about this contact.</p>
            </TabsContent>
            <TabsContent value="deals" className="pt-4">
              <p className="text-sm text-gray-400">No deals yet. Create a deal to track this opportunity.</p>
            </TabsContent>
          </Tabs>

          <Button onClick={handleEnableScoring} className="w-full mt-6">
            Enable AI Lead Scoring for All Contacts
          </Button>
        </Card>
      )}

      {/* Step 3: Complete */}
      {step === 3 && (
        <Card className="p-6 border-green-500/20 bg-green-500/5">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl mb-2">🎉 Demo Complete!</h3>
              <p className="text-gray-400">You've learned how to:</p>
              <ul className="text-sm text-gray-400 mt-2 space-y-1">
                <li>✓ Create and enrich contacts with AI</li>
                <li>✓ View AI-generated lead scores</li>
                <li>✓ Enable automatic scoring for your pipeline</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setStep(1)}>
                Try Again
              </Button>
              <Button>Go to CRM Page</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
