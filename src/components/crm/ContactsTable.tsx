"use client";

import { Contact } from "./CRMDashboard";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactsTableProps {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ContactsTable({
  contacts,
  selectedId,
  onSelect,
}: ContactsTableProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase().slice(0, 2);
  };

  if (contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center px-6">
        <div>
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No contacts found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {contacts.map((contact) => (
        <button
          key={contact.id}
          onClick={() => onSelect(contact.id)}
          className={cn(
            "w-full p-4 text-left hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            selectedId === contact.id && "bg-muted"
          )}
          aria-label={`Select contact ${contact.firstName} ${contact.lastName}`}
        >
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm font-medium">
                {getInitials(contact.firstName, contact.lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {contact.firstName} {contact.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {contact.title} {contact.company && `· ${contact.company}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2">
                {contact.email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[140px]">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{contact.phone}</span>
                  </div>
                )}
              </div>

              {contact.tags && contact.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  {contact.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[9px] px-1.5 py-0 h-4 bg-slate-50 border-slate-200 text-slate-700"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}







