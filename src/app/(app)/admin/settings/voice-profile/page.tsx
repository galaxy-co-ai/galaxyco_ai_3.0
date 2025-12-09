import { Metadata } from 'next';
import { VoiceProfileSettings } from '@/components/admin/ArticleStudio/VoiceProfileSettings';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Voice Profile | Mission Control',
  description: 'Configure your blog voice profile for AI-assisted writing',
};

export default function VoiceProfilePage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/settings">
          <Button variant="ghost" size="sm" aria-label="Back to settings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </Link>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Blog Voice Profile</h2>
        <p className="text-muted-foreground">
          Configure how AI generates content to match your blog&apos;s unique voice and style
        </p>
      </div>

      {/* Voice Profile Settings Component */}
      <VoiceProfileSettings />
    </div>
  );
}

