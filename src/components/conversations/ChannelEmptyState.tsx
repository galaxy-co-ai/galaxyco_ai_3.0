"use client";

import { Button } from "@/components/ui/button";
import {
  Mail,
  MessageSquare,
  Phone,
  MessageCircle,
  Globe,
  ExternalLink,
  ArrowRight,
  Inbox,
  Sparkles,
  Settings,
} from "lucide-react";

type ChannelType = 'all' | 'email' | 'sms' | 'call' | 'whatsapp' | 'social' | 'live_chat';

interface ChannelEmptyStateProps {
  channel: ChannelType;
  onStartConversation?: () => void;
}

const channelConfig: Record<ChannelType, {
  icon: typeof Mail;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  setupSteps: string[];
  setupLink?: string;
  setupLinkText?: string;
}> = {
  all: {
    icon: Inbox,
    title: "Your inbox is empty",
    description: "Connect a channel to start receiving and sending messages from one unified hub.",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    setupSteps: [
      "Connect your first channel below",
      "Incoming messages will appear here",
      "Reply to customers from any channel",
    ],
  },
  email: {
    icon: Mail,
    title: "Email not connected",
    description: "Connect an email provider to send and receive emails directly in your inbox.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    setupSteps: [
      "Add your email provider API key",
      "Configure inbound webhook for replies",
      "Start sending emails to customers",
    ],
    setupLink: "/settings",
    setupLinkText: "Configure Email",
  },
  sms: {
    icon: MessageSquare,
    title: "SMS not connected",
    description: "Connect Twilio to send and receive text messages with your customers.",
    color: "text-green-600",
    bgColor: "bg-green-50",
    setupSteps: [
      "Create a Twilio account",
      "Add your Twilio credentials",
      "Get a phone number for SMS",
    ],
    setupLink: "https://console.twilio.com",
    setupLinkText: "Open Twilio Console",
  },
  call: {
    icon: Phone,
    title: "Voice calls not connected",
    description: "Connect Twilio Voice to make and receive phone calls from your dashboard.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    setupSteps: [
      "Set up Twilio account",
      "Enable Voice capabilities",
      "Configure call forwarding",
    ],
    setupLink: "https://console.twilio.com",
    setupLinkText: "Open Twilio Console",
  },
  whatsapp: {
    icon: MessageCircle,
    title: "WhatsApp not connected",
    description: "Connect WhatsApp Business to chat with customers on their favorite app.",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    setupSteps: [
      "Apply for WhatsApp Business API",
      "Connect via Twilio or Meta",
      "Get your templates approved",
    ],
    setupLink: "https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn",
    setupLinkText: "Set Up WhatsApp",
  },
  social: {
    icon: Globe,
    title: "Social DMs coming soon",
    description: "We're working on integrating Instagram, Facebook, and Twitter DMs.",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    setupSteps: [
      "Connect Instagram Business",
      "Link Facebook Messenger",
      "Add Twitter/X integration",
    ],
  },
  live_chat: {
    icon: MessageCircle,
    title: "Live chat coming soon",
    description: "Embed a chat widget on your website to talk to visitors in real-time.",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    setupSteps: [
      "Add chat widget to your site",
      "Customize appearance",
      "Set up auto-responses",
    ],
  },
};

export default function ChannelEmptyState({ channel, onStartConversation }: ChannelEmptyStateProps) {
  const config = channelConfig[channel];
  const Icon = config.icon;
  const isComingSoon = channel === 'social' || channel === 'live_chat';

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex flex-col items-center text-center max-w-sm">
        {/* Icon */}
        <div className={`rounded-2xl ${config.bgColor} p-5 mb-5`}>
          <Icon className={`h-10 w-10 ${config.color}`} />
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {config.title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6">
          {config.description}
        </p>

        {/* Setup Steps */}
        <div className="w-full space-y-3 mb-6">
          {config.setupSteps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-3 text-sm text-left"
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${config.bgColor} ${config.color} text-xs font-medium`}>
                {index + 1}
              </div>
              <span className="text-muted-foreground pt-0.5">{step}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full">
          {config.setupLink && !isComingSoon && (
            <Button
              asChild
              className={`w-full ${channel === 'email' ? 'bg-blue-600 hover:bg-blue-700' : 
                channel === 'sms' || channel === 'call' ? 'bg-purple-600 hover:bg-purple-700' : 
                channel === 'whatsapp' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
            >
              <a href={config.setupLink} target={config.setupLink.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">
                {config.setupLinkText}
                {config.setupLink.startsWith('http') && <ExternalLink className="ml-2 h-4 w-4" />}
                {!config.setupLink.startsWith('http') && <ArrowRight className="ml-2 h-4 w-4" />}
              </a>
            </Button>
          )}
          
          {isComingSoon && (
            <Button disabled className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              Coming Soon
            </Button>
          )}

          {channel === 'all' && (
            <Button variant="outline" asChild className="w-full">
              <a href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Go to Settings
              </a>
            </Button>
          )}
        </div>

        {/* Help Text */}
        {!isComingSoon && channel !== 'all' && (
          <p className="text-xs text-muted-foreground mt-5">
            Need help? Check our{" "}
            <a href="/docs" className="text-primary hover:underline">
              setup guide
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
