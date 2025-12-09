"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Settings,
  Users,
  Play,
  Pause,
  Trash2,
  Plus,
  Bot,
  Crown,
  Shield,
  Wrench,
  Loader2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Department configuration - light theme
const departmentConfig: Record<
  string,
  { icon: string; label: string; color: string; bgColor: string; borderColor: string }
> = {
  sales: { icon: "💰", label: "Sales", color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  marketing: { icon: "📢", label: "Marketing", color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  support: { icon: "🎧", label: "Support", color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  operations: { icon: "⚙️", label: "Operations", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
  finance: { icon: "💳", label: "Finance", color: "text-teal-700", bgColor: "bg-teal-50", borderColor: "border-teal-200" },
  product: { icon: "🚀", label: "Product", color: "text-indigo-700", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
  general: { icon: "🤖", label: "General", color: "text-gray-700", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
};

// Role icons and labels - light theme
const roleConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  coordinator: {
    icon: <Crown className="h-4 w-4" />,
    label: "Coordinator",
    color: "text-yellow-600",
  },
  specialist: {
    icon: <Wrench className="h-4 w-4" />,
    label: "Specialist",
    color: "text-blue-600",
  },
  support: {
    icon: <Shield className="h-4 w-4" />,
    label: "Support",
    color: "text-green-600",
  },
};

// Status configuration - light theme
const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  active: { label: "Active", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200" },
  paused: { label: "Paused", color: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
  archived: { label: "Archived", color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
};

interface TeamMember {
  id: string;
  agentId: string;
  role: string;
  priority: number;
  agent: {
    id: string;
    name: string;
    type: string;
    status: string;
    description: string | null;
  } | null;
}

interface Team {
  id: string;
  name: string;
  department: string;
  description: string | null;
  status: string;
  config: {
    autonomyLevel?: string;
    approvalRequired?: string[];
    workingHours?: { start: string; end: string; timezone: string };
    maxConcurrentTasks?: number;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  coordinator: {
    id: string;
    name: string;
    status: string;
  } | null;
  members: TeamMember[];
}

interface TeamDetailClientProps {
  team: Team;
  availableAgents: Array<{ id: string; name: string; type: string; status: string }>;
}

export default function TeamDetailClient({
  team: initialTeam,
  availableAgents,
}: TeamDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [editedName, setEditedName] = useState(initialTeam.name);
  const [editedDescription, setEditedDescription] = useState(initialTeam.description || "");
  const [objective, setObjective] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedRole, setSelectedRole] = useState("specialist");
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Fetch team data with SWR
  const { data: teamData, mutate } = useSWR<{ team: Team }>(
    `/api/orchestration/teams/${initialTeam.id}`,
    fetcher,
    {
      fallbackData: { team: initialTeam },
      refreshInterval: 30000,
    }
  );

  const team: Team = teamData?.team || initialTeam;
  const dept = departmentConfig[team.department] || departmentConfig.general;
  const status = statusConfig[team.status] || statusConfig.active;

  // Save team changes
  const saveChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/orchestration/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedName,
          description: editedDescription,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save changes");
      }

      toast.success("Team updated successfully");
      setIsEditing(false);
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }, [team.id, editedName, editedDescription, mutate]);

  // Update team status
  const updateStatus = useCallback(
    async (newStatus: string) => {
      try {
        const response = await fetch(`/api/orchestration/teams/${team.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update status");
        }

        toast.success(`Team ${newStatus === "active" ? "activated" : "paused"}`);
        mutate();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update status");
      }
    },
    [team.id, mutate]
  );

  // Run team with objective
  const runTeam = useCallback(async () => {
    if (!objective.trim()) {
      toast.error("Please enter an objective for the team");
      return;
    }

    setIsRunning(true);
    try {
      const response = await fetch(`/api/orchestration/teams/${team.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to run team");
      }

      toast.success("Team execution started");
      setObjective("");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to run team");
    } finally {
      setIsRunning(false);
    }
  }, [team.id, objective, mutate]);

  // Add member to team
  const addMember = useCallback(async () => {
    if (!selectedAgentId) {
      toast.error("Please select an agent");
      return;
    }

    setIsAddingMember(true);
    try {
      const response = await fetch(`/api/orchestration/teams/${team.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgentId,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add member");
      }

      toast.success("Member added successfully");
      setShowAddMember(false);
      setSelectedAgentId("");
      setSelectedRole("specialist");
      mutate();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  }, [team.id, selectedAgentId, selectedRole, mutate, router]);

  // Remove member from team
  const removeMember = useCallback(
    async (memberId: string) => {
      if (!confirm("Remove this agent from the team?")) return;

      try {
        const response = await fetch(`/api/orchestration/teams/${team.id}/members`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to remove member");
        }

        toast.success("Member removed");
        mutate();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to remove member");
      }
    },
    [team.id, mutate, router]
  );

  // Delete team
  const deleteTeam = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone."))
      return;

    try {
      const response = await fetch(`/api/orchestration/teams/${team.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete team");
      }

      toast.success("Team deleted");
      router.push("/orchestration/teams");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete team");
    }
  }, [team.id, router]);

  return (
    <div className="flex h-full flex-col bg-gray-50/50">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
          <div className="flex items-center gap-4">
            <Link href="/orchestration/teams">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Back to teams"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div
                className={cn("p-3 rounded-xl text-2xl", dept.bgColor)}
                aria-hidden="true"
              >
                {dept.icon}
              </div>
              <div>
                {isEditing ? (
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-xl font-bold"
                    aria-label="Team name"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{team.name}</h1>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn(dept.bgColor, dept.color, "border", dept.borderColor)}>
                    {dept.label}
                  </Badge>
                  <Badge className={cn(status.bgColor, status.color, "border", status.borderColor)}>
                    {status.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveChanges}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {team.status === "active" ? (
                  <Button
                    variant="outline"
                    onClick={() => updateStatus("paused")}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => updateStatus("active")}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Activate
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={deleteTeam}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">
              Members ({team.members.length})
            </TabsTrigger>
            <TabsTrigger value="run">Run Team</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Description Card */}
              <Card className="lg:col-span-2 p-6">
                <h3 className="font-semibold mb-3">Description</h3>
                {isEditing ? (
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full h-24 p-3 rounded-lg border bg-background resize-none"
                    placeholder="Describe what this team does..."
                    aria-label="Team description"
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {team.description || "No description provided."}
                  </p>
                )}
              </Card>

              {/* Stats Card */}
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Team Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Members</span>
                    <span className="font-medium">{team.members.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Autonomy Level</span>
                    <span className="font-medium capitalize">
                      {(team.config?.autonomyLevel || "semi_autonomous").replace("_", "-")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(team.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(team.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Member Overview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Team Members</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab("members")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {team.members.slice(0, 4).map((member) => {
                  const role = roleConfig[member.role] || roleConfig.specialist;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                    >
                      <div className="p-2 rounded-lg bg-violet-100">
                        <Bot className="h-4 w-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.agent?.name || "Unknown Agent"}
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          <span className={role.color}>{role.icon}</span>
                          <span className="text-muted-foreground">{role.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Team Members</h3>
              <Button
                onClick={() => setShowAddMember(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={availableAgents.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            {team.members.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Members Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Add agents to your team to get started with orchestration.
                </p>
                <Button
                  onClick={() => setShowAddMember(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={availableAgents.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Member
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.members.map((member) => {
                  const role = roleConfig[member.role] || roleConfig.specialist;
                  const agentStatus =
                    member.agent?.status === "active"
                      ? { color: "text-green-600", bg: "bg-green-500" }
                      : { color: "text-gray-500", bg: "bg-gray-400" };

                  return (
                    <Card key={member.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-violet-100">
                            <Bot className="h-6 w-6 text-violet-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">
                              {member.agent?.name || "Unknown Agent"}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={cn(
                                  "text-xs border",
                                  member.role === "coordinator"
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : member.role === "support"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                )}
                              >
                                {role.icon}
                                <span className="ml-1">{role.label}</span>
                              </Badge>
                              <div className="flex items-center gap-1">
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    agentStatus.bg
                                  )}
                                />
                                <span
                                  className={cn("text-xs", agentStatus.color)}
                                >
                                  {member.agent?.status || "unknown"}
                                </span>
                              </div>
                            </div>
                            {member.agent?.type && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Type: {member.agent.type}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(member.id)}
                          className="text-red-600 hover:bg-red-50"
                          aria-label={`Remove ${member.agent?.name || "agent"} from team`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {member.agent?.description && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {member.agent.description}
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Add Member Modal */}
            {showAddMember && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <Card className="w-full max-w-md p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Add Team Member
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="agent-select">
                        Select Agent
                      </Label>
                      <select
                        id="agent-select"
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-md border bg-background"
                      >
                        <option value="">Choose an agent...</option>
                        {availableAgents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} ({agent.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="role-select">
                        Role
                      </Label>
                      <select
                        id="role-select"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-md border bg-background"
                      >
                        <option value="coordinator">Coordinator - Leads the team</option>
                        <option value="specialist">Specialist - Domain expert</option>
                        <option value="support">Support - Assists team members</option>
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddMember(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={addMember}
                        disabled={isAddingMember || !selectedAgentId}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isAddingMember ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Add Member
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Run Team Tab */}
          <TabsContent value="run" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Run Team with Objective</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Give your team a high-level objective and they&apos;ll coordinate to accomplish it.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="objective">
                    Objective
                  </Label>
                  <textarea
                    id="objective"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full mt-1 h-24 p-3 rounded-lg border bg-background resize-none"
                    placeholder="e.g., Follow up with all stalled leads from this week..."
                  />
                </div>
                <Button
                  onClick={runTeam}
                  disabled={isRunning || team.status !== "active" || !objective.trim()}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Team
                </Button>
                {team.status !== "active" && (
                  <p className="text-yellow-600 text-sm">
                    Team must be active to run. Currently: {team.status}
                  </p>
                )}
              </div>
            </Card>

            {/* Example Objectives */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Example Objectives</h3>
              <div className="space-y-3">
                {[
                  "Follow up with all leads that haven't been contacted in 7 days",
                  "Review and prioritize all pending tasks by urgency",
                  "Generate weekly performance report for the team",
                  "Process and respond to all unread customer inquiries",
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setObjective(example)}
                    className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Team Configuration</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-medium">Autonomy Level</p>
                    <p className="text-sm text-muted-foreground">
                      Controls how much human oversight is required
                    </p>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                    {(team.config?.autonomyLevel || "semi_autonomous").replace("_", "-")}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-medium">Max Concurrent Tasks</p>
                    <p className="text-sm text-muted-foreground">
                      Maximum tasks the team can handle simultaneously
                    </p>
                  </div>
                  <span className="font-medium">
                    {team.config?.maxConcurrentTasks || 5}
                  </span>
                </div>
                {team.config?.workingHours && (
                  <div className="flex justify-between items-center py-3 border-b">
                    <div>
                      <p className="font-medium">Working Hours</p>
                      <p className="text-sm text-muted-foreground">
                        When the team is active
                      </p>
                    </div>
                    <span className="font-medium">
                      {team.config.workingHours.start} - {team.config.workingHours.end}{" "}
                      ({team.config.workingHours.timezone})
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-red-200 bg-red-50/50">
              <h3 className="font-semibold text-red-700 mb-4">Danger Zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Team</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this team and remove all member associations
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={deleteTeam}
                  className="border-red-300 text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Team
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
