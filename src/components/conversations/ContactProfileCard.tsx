"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Building2, User, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "./ConversationsDashboard";

interface ContactProfileCardProps {
  conversation: Conversation;
}

interface ContactInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  type: 'contact' | 'prospect' | 'customer';
  tags?: string[];
}

export default function ContactProfileCard({ conversation }: ContactProfileCardProps) {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        setIsLoading(true);
        // Find the primary participant (linked to CRM)
        const primaryParticipant = conversation.participants.find(
          p => p.contactId || p.prospectId || p.customerId
        );

        if (!primaryParticipant) {
          // No CRM link, use participant info
          const participant = conversation.participants[0];
          if (participant) {
            setContactInfo({
              id: participant.id,
              name: participant.name || participant.email || "Unknown",
              email: participant.email || undefined,
              phone: participant.phone || undefined,
              type: 'contact',
            });
          }
          return;
        }

        // Fetch from CRM based on type
        let endpoint = "";
        if (primaryParticipant.contactId) {
          endpoint = `/api/crm/contacts/${primaryParticipant.contactId}`;
        } else if (primaryParticipant.prospectId) {
          endpoint = `/api/crm/prospects/${primaryParticipant.prospectId}`;
        } else if (primaryParticipant.customerId) {
          endpoint = `/api/crm/customers/${primaryParticipant.customerId}`;
        }

        if (endpoint) {
          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            setContactInfo({
              id: data.id,
              name: data.name || `${data.firstName} ${data.lastName}`.trim(),
              email: data.email,
              phone: data.phone,
              company: data.company,
              title: data.title,
              type: primaryParticipant.contactId ? 'contact' : primaryParticipant.prospectId ? 'prospect' : 'customer',
              tags: data.tags || [],
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch contact info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactInfo();
  }, [conversation]);

  if (isLoading) {
    return (
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading contact info...</span>
        </div>
      </div>
    );
  }

  if (!contactInfo) {
    return (
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {conversation.participants[0]?.name?.slice(0, 2).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">
              {conversation.participants[0]?.name || conversation.participants[0]?.email || "Unknown"}
            </p>
            <p className="text-sm text-muted-foreground">
              {conversation.participants[0]?.email || conversation.participants[0]?.phone || "No contact info"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const typeColors = {
    contact: "bg-blue-100 text-blue-700",
    prospect: "bg-orange-100 text-orange-700",
    customer: "bg-green-100 text-green-700",
  };

  return (
    <div className="border-b bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src="" />
          <AvatarFallback>
            {contactInfo.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{contactInfo.name}</h3>
            <Badge
              variant="outline"
              className={cn("text-xs", typeColors[contactInfo.type])}
            >
              {contactInfo.type}
            </Badge>
          </div>
          {contactInfo.title && (
            <p className="text-sm text-muted-foreground">{contactInfo.title}</p>
          )}
          {contactInfo.company && (
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {contactInfo.company}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {contactInfo.email && (
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
                <Mail className="h-3.5 w-3.5" />
                {contactInfo.email}
              </Button>
            )}
            {contactInfo.phone && (
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
                <Phone className="h-3.5 w-3.5" />
                {contactInfo.phone}
              </Button>
            )}
          </div>
          {contactInfo.tags && contactInfo.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {contactInfo.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 gap-1.5 text-xs"
            onClick={() => {
              const path = contactInfo.type === 'contact' 
                ? `/crm?tab=contacts&id=${contactInfo.id}`
                : contactInfo.type === 'prospect'
                ? `/crm?tab=leads&id=${contactInfo.id}`
                : `/crm?tab=organizations&id=${contactInfo.id}`;
              window.location.href = path;
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View in CRM
          </Button>
        </div>
      </div>
    </div>
  );
}
