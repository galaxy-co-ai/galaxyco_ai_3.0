"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Member {
  id: string;
  userId: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface TeamChannelSettingsProps {
  channelId: string;
  channelName: string;
  channelDescription: string | null;
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const BUBBLE_COLORS = [
  { value: "blue", label: "Blue", bg: "bg-blue-500", preview: "#3b82f6" },
  { value: "green", label: "Green", bg: "bg-green-500", preview: "#22c55e" },
  { value: "purple", label: "Purple", bg: "bg-purple-500", preview: "#a855f7" },
  { value: "pink", label: "Pink", bg: "bg-pink-500", preview: "#ec4899" },
  { value: "orange", label: "Orange", bg: "bg-orange-500", preview: "#f97316" },
  { value: "red", label: "Red", bg: "bg-red-500", preview: "#ef4444" },
  { value: "yellow", label: "Yellow", bg: "bg-yellow-500", preview: "#eab308" },
  { value: "teal", label: "Teal", bg: "bg-teal-500", preview: "#14b8a6" },
  { value: "indigo", label: "Indigo", bg: "bg-indigo-500", preview: "#6366f1" },
  { value: "gray", label: "Gray", bg: "bg-gray-500", preview: "#6b7280" },
];

export function TeamChannelSettings({
  channelId,
  channelName,
  channelDescription,
  members,
  isOpen,
  onClose,
  onUpdate,
}: TeamChannelSettingsProps) {
  const [name, setName] = useState(channelName);
  const [description, setDescription] = useState(channelDescription || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [memberColors, setMemberColors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(channelName);
    setDescription(channelDescription || "");
    // Load member colors from localStorage or default
    const savedColors = localStorage.getItem(`channel-${channelId}-colors`);
    if (savedColors) {
      setMemberColors(JSON.parse(savedColors));
    } else {
      // Auto-assign colors to members
      const colors: Record<string, string> = {};
      members.forEach((member, idx) => {
        colors[member.userId] = BUBBLE_COLORS[idx % BUBBLE_COLORS.length].value;
      });
      setMemberColors(colors);
    }

    // Load notification preference
    const savedNotif = localStorage.getItem(`channel-${channelId}-notifications`);
    setNotificationsEnabled(savedNotif !== "false");
  }, [channelId, channelName, channelDescription, members]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    setIsSaving(true);
    try {
      // Save channel settings to server
      const res = await fetch(`/api/team/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.toLowerCase().replace(/\s+/g, "-"),
          description: description.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update channel");
      }

      // Save member colors to localStorage
      localStorage.setItem(`channel-${channelId}-colors`, JSON.stringify(memberColors));
      
      // Save notification preference
      localStorage.setItem(`channel-${channelId}-notifications`, String(notificationsEnabled));

      toast.success("Channel settings updated");
      onUpdate();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (member: Member) => {
    if (member.user.firstName && member.user.lastName) {
      return `${member.user.firstName[0]}${member.user.lastName[0]}`.toUpperCase();
    }
    return member.user.email[0]?.toUpperCase() || "?";
  };

  const getMemberName = (member: Member) => {
    if (member.user.firstName && member.user.lastName) {
      return `${member.user.firstName} ${member.user.lastName}`;
    }
    return member.user.email;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Channel Settings</DialogTitle>
          <DialogDescription>
            Configure #{channelName} settings and member preferences
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-180px)] px-6">
          <div className="space-y-6 pb-4">
            {/* Channel Name */}
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="channel-name"
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and hyphens only
              </p>
            </div>

            {/* Channel Description */}
            <div className="space-y-2">
              <Label htmlFor="channel-description">Description</Label>
              <Textarea
                id="channel-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this channel about?"
                className="min-h-[60px] resize-none"
              />
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified about new messages in this channel
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>

            {/* Member Bubble Colors */}
            <div className="space-y-3">
              <Label>Message Bubble Colors</Label>
              <p className="text-xs text-muted-foreground">
                Assign colors to each member for iOS-style messaging
              </p>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(member)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{getMemberName(member)}</p>
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {BUBBLE_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() =>
                            setMemberColors((prev) => ({
                              ...prev,
                              [member.userId]: color.value,
                            }))
                          }
                          className={`w-6 h-6 rounded-full ${color.bg} transition-transform hover:scale-110 ${
                            memberColors[member.userId] === color.value
                              ? "ring-2 ring-offset-2 ring-foreground"
                              : ""
                          }`}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
