import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Sparkles, Send, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

const aiSuggestions = [
  {
    tone: 'professional',
    subject: 'Following up on our conversation',
    body: `Hi [Name],

It was great speaking with you yesterday about [Topic]. I wanted to follow up on the key points we discussed and share some additional resources that might be helpful.

Based on our conversation, I think [Solution] would be a perfect fit for your team's needs. Here's why:

• [Benefit 1]
• [Benefit 2]  
• [Benefit 3]

Would you have 15 minutes next week to dive deeper into how we can help? I'm available Tuesday or Thursday afternoon.

Looking forward to continuing our conversation!

Best regards,
[Your Name]`
  },
  {
    tone: 'friendly',
    subject: 'Quick follow-up from our chat!',
    body: `Hey [Name]!

Thanks so much for taking the time to chat yesterday - I really enjoyed our conversation about [Topic]!

I've been thinking about what you mentioned, and I believe we have something that could really help. Let me share a few quick thoughts:

🚀 [Key insight 1]
💡 [Key insight 2]
⭐ [Key insight 3]

Want to hop on a quick call next week to explore this further? No pressure - just think it could be valuable!

Let me know what works for you!

Cheers,
[Your Name]`
  },
  {
    tone: 'concise',
    subject: 'Next steps',
    body: `[Name],

Three things from yesterday's call:

1. [Point 1]
2. [Point 2]
3. [Point 3]

Free Tuesday 2pm or Thursday 10am for a 15-min follow-up?

— [Your Name]`
  }
];

export function EmailComposerDemo() {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [emailData, setEmailData] = useState({
    to: 'sarah@company.com',
    subject: '',
    body: ''
  });

  const handleGenerateAI = () => {
    if (!prompt.trim()) {
      toast.error('Please describe what you want to write');
      return;
    }

    toast.loading('AI is drafting your email...', { id: 'generate' });
    
    setTimeout(() => {
      toast.success('3 email variations generated!', { id: 'generate' });
      setStep(2);
    }, 1500);
  };

  const handleSelectSuggestion = (index: number) => {
    setSelectedSuggestion(index);
    const suggestion = aiSuggestions[index];
    setEmailData({
      ...emailData,
      subject: suggestion.subject,
      body: suggestion.body
    });
    setStep(3);
  };

  const handleSend = () => {
    toast.success('Email sent successfully!', {
      description: 'Your AI-crafted email is on its way.'
    });
    setTimeout(() => setStep(4), 500);
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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 4 ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
            4
          </div>
        </div>
        <Badge variant="outline" className="bg-purple-500/10">
          Guided Demo
        </Badge>
      </div>

      {/* Step 1: Describe Email */}
      {step === 1 && (
        <Card className="p-6 space-y-4 border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg">Step 1: Tell AI What to Write</h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">To</label>
            <Input value={emailData.to} onChange={(e) => setEmailData({...emailData, to: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">What do you want to say?</label>
            <Textarea
              placeholder="E.g., 'Follow up on yesterday's call about their CRM needs. Mention we can help with lead scoring and offer a demo next week.'"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrompt('Follow up on yesterday\'s call about their CRM needs. Mention we can help with lead scoring and offer a demo next week.')}
            >
              Example 1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrompt('Send a cold outreach to a VP of Sales at a mid-market company. Highlight our AI automation capabilities.')}
            >
              Example 2
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrompt('Thank them for the meeting and ask about next steps. Keep it brief and friendly.')}
            >
              Example 3
            </Button>
          </div>

          <Button onClick={handleGenerateAI} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </Button>
        </Card>
      )}

      {/* Step 2: Choose Variation */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg">Step 2: Choose Your Favorite Variation</h3>
          </div>

          {aiSuggestions.map((suggestion, index) => (
            <Card
              key={index}
              className="p-4 border-purple-500/20 hover:border-purple-500/40 cursor-pointer transition-colors"
              onClick={() => handleSelectSuggestion(index)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Badge variant="outline" className="mb-2">{suggestion.tone}</Badge>
                  <p className="text-sm">{suggestion.subject}</p>
                </div>
              </div>
              <div className="text-sm text-gray-400 whitespace-pre-wrap line-clamp-4">
                {suggestion.body}
              </div>
              <Button variant="outline" size="sm" className="mt-3">
                Use This Version
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Step 3: Edit & Send */}
      {step === 3 && (
        <Card className="p-6 space-y-4 border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg">Step 3: Edit & Send</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <ThumbsDown className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">To</label>
              <Input value={emailData.to} onChange={(e) => setEmailData({...emailData, to: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Subject</label>
              <Input value={emailData.subject} onChange={(e) => setEmailData({...emailData, subject: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Message</label>
              <Textarea
                value={emailData.body}
                onChange={(e) => setEmailData({...emailData, body: e.target.value})}
                rows={12}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-blue-400">AI learns from your edits to improve future suggestions</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
              Back to Variations
            </Button>
            <Button className="flex-1" onClick={handleSend}>
              <Send className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 4 && (
        <Card className="p-6 border-green-500/20 bg-green-500/5">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Send className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl mb-2">🎉 Email Sent!</h3>
              <p className="text-gray-400">You've learned how to:</p>
              <ul className="text-sm text-gray-400 mt-2 space-y-1">
                <li>✓ Describe emails in natural language</li>
                <li>✓ Choose from AI-generated variations</li>
                <li>✓ Edit and refine AI suggestions</li>
                <li>✓ Send polished emails in seconds</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-sm">
                <span className="text-purple-400">Time saved:</span> ~15 minutes per email
              </p>
              <p className="text-sm text-gray-400 mt-1">
                With 20 emails/week, that's <span className="text-green-400">5 hours saved</span> monthly!
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => { setStep(1); setSelectedSuggestion(null); }}>
                Try Again
              </Button>
              <Button>Enable AI Email Assistant</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
