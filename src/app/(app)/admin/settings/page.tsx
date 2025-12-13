import { Metadata } from 'next';
import { 
  Settings, 
  Bell, 
  Shield,
  Globe,
  Brain,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Settings | Mission Control',
  description: 'Platform configuration and settings',
};

const settingSections = [
  {
    title: 'General',
    description: 'Basic platform configuration',
    icon: Settings,
    items: [
      { name: 'Platform Name', value: 'GalaxyCo.ai', editable: false },
      { name: 'Default Language', value: 'English', editable: true },
      { name: 'Timezone', value: 'UTC', editable: true },
    ],
  },
  {
    title: 'Notifications',
    description: 'Email and push notification settings',
    icon: Bell,
    items: [
      { name: 'Admin Alerts', value: 'Enabled', editable: true },
      { name: 'User Signup Notifications', value: 'Enabled', editable: true },
      { name: 'Weekly Reports', value: 'Disabled', editable: true },
    ],
  },
  {
    title: 'Security',
    description: 'Authentication and access control',
    icon: Shield,
    items: [
      { name: 'Two-Factor Auth', value: 'Optional', editable: true },
      { name: 'Session Timeout', value: '24 hours', editable: true },
      { name: 'Password Policy', value: 'Standard', editable: true },
    ],
  },
  {
    title: 'Integrations',
    description: 'Third-party service connections',
    icon: Globe,
    items: [
      { name: 'Clerk Authentication', value: 'Connected', status: 'success' },
      { name: 'OpenAI API', value: 'Connected', status: 'success' },
      { name: 'Stripe Payments', value: 'Connected', status: 'success' },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Settings</h2>
        <p className="text-muted-foreground">
          Configure global platform settings and integrations
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid gap-6">
        {settingSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.items.map((item, index) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {'status' in item ? (
                            <Badge 
                              variant="outline" 
                              className={
                                item.status === 'success' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }
                            >
                              {item.value}
                            </Badge>
                          ) : (
                            <>
                              <span className="text-sm text-muted-foreground">
                                {item.value}
                              </span>
                              {item.editable && (
                                <Button variant="ghost" size="sm">
                                  Edit
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      {index < section.items.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Article Studio Settings */}
      <Card className="border-violet-200 bg-violet-50/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <Brain className="h-5 w-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-violet-900">Article Studio</CardTitle>
              <CardDescription className="text-violet-700">
                AI writing assistance and voice profile settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Voice Profile</p>
                <p className="text-sm text-muted-foreground">
                  Train AI to match your blog&apos;s writing style
                </p>
              </div>
              <Link href="/admin/settings/voice-profile">
                <Button variant="outline" size="sm" className="gap-2">
                  Configure
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-red-700">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Clear All Analytics</p>
                <p className="text-sm text-muted-foreground">
                  Remove all analytics events from the database
                </p>
              </div>
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                Clear Data
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Export All Data</p>
                <p className="text-sm text-muted-foreground">
                  Download a complete backup of platform data
                </p>
              </div>
              <Button variant="outline">
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

