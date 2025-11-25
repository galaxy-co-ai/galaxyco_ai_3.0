"use client";

import { Contact } from "./CRMDashboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Phone,
  Calendar,
  Building2,
  MessageSquare,
  Tag,
  Edit,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ContactDetailViewProps {
  contact: Contact;
  formatDate: (date: Date | null) => string;
  onDelete?: (contactId: string) => void;
}

export default function ContactDetailView({ contact, formatDate, onDelete }: ContactDetailViewProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase().slice(0, 2);
  };

  const fullName = `${contact.firstName} ${contact.lastName}`.trim();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 pb-6 border-b">
        <Avatar className="h-12 w-12 border-2 border-slate-200">
          <AvatarFallback className="text-sm font-semibold bg-cyan-100 text-cyan-700">
            {getInitials(contact.firstName, contact.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="text-base font-semibold text-slate-900">{fullName}</h2>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="Edit contact">
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="More options">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      if (onDelete) {
                        onDelete(contact.id);
                      }
                    }}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete Contact
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {contact.title && (
            <p className="text-xs text-slate-600 mb-2">{contact.title}</p>
          )}
          {contact.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {contact.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 bg-slate-50 border-slate-200 text-slate-700"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <Card className="p-4">
        <h3 className="text-xs font-semibold text-slate-900 mb-3">Contact Information</h3>
        <div className="space-y-2">
          {contact.email && (
            <div className="flex items-center gap-2 text-xs">
              <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <a
                href={`mailto:${contact.email}`}
                className="text-slate-700 hover:text-cyan-600 truncate"
              >
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-xs">
              <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <a
                href={`tel:${contact.phone}`}
                className="text-slate-700 hover:text-cyan-600"
              >
                {contact.phone}
              </a>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center gap-2 text-xs">
              <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-slate-700">{contact.company}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Professional Info */}
      <div className="grid grid-cols-2 gap-4">
        {contact.title && (
          <Card className="p-3 border-slate-200">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Title</p>
            <p className="text-sm font-semibold text-slate-900">{contact.title}</p>
          </Card>
        )}
        {contact.company && (
          <Card className="p-3 border-slate-200">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Company</p>
            <p className="text-sm font-semibold text-slate-900">{contact.company}</p>
          </Card>
        )}
      </div>

      {/* Tags */}
      {contact.tags.length > 0 && (
        <Card className="p-4">
          <h3 className="text-xs font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            Tags
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {contact.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] px-2 py-0.5 bg-slate-50 border-slate-200 text-slate-700"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 pt-4">
        {contact.email && (
          <Button className="flex-1">
            <Mail className="h-3 w-3 mr-1.5" />
            Send Email
          </Button>
        )}
        {contact.phone && (
          <Button variant="outline" className="flex-1">
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
        )}
        <Button variant="outline" className="flex-1">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule
        </Button>
      </div>
    </div>
  );
}





