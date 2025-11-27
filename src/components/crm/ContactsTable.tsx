"use client";

import { Contact } from "./CRMDashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Building2, Users, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactsTableProps {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew?: () => void;
}

export default function ContactsTable({
  contacts,
  selectedId,
  onSelect,
  onAddNew,
}: ContactsTableProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase().slice(0, 2);
  };

  if (contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center px-6 py-8">
        <div className="max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Build your network</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Contacts are the people you do business with. Import or add them here.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              size="sm" 
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={onAddNew}
            >
              <UserPlus className="h-4 w-4" />
              Add Contact
            </Button>
            <p className="text-xs text-muted-foreground">
              Import from CSV or sync with your email
            </p>
          </div>
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







