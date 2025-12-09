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

// Department configuration
const departmentConfig: Record<
  string,
  { icon: string; label: string; color: string; bgColor: string }
> = {
  sales: { icon: "💰", label: "Sales", color: "text-emerald-600", bgColor: "bg-emerald-50" },
  marketing: { icon: "📢", label: "Marketing", color: "text-blue-600", bgColor: "bg-blue-50" },
  support: { icon: "🎧", label: "Support", color: "text-purple-600", bgColor: "bg-purple-50" },
  operations: { icon: "⚙️", label: "Operations", color: "text-amber-600", bgColor: "bg-amber-50" },
  finance: { icon: "💳", label: "Finance", color: "text-teal-600", bgColor: "bg-teal-50" },
  product: { icon: "🚀", label: "Product", color: "text-indigo-600", bgColor: "bg-indigo-50" },
  general: { icon: "🤖", label: "General", color: "text-gray-600", bgColor: "bg-gray-50" },
};

// Role icons and labels
const roleConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  coordinator: {
    icon: <Crown className="h-4 w-4" />,
    label: "Coordinator",
    color: "text-yellow-400",
  },
  specialist: {
    icon: <Wrench className="h-4 w-4" />,
    label: "Specialist",
    color: "text-blue-400",
  },
  support: {
    icon: <Shield className="h-4 w-4" />,
    label: "Support",
    color: "text-green-400",
  },
};

// Status configuration
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: "Active", color: "text-green-400", bgColor: "bg-green-500/20" },
  paused: { label: "Paused", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  archived: { label: "Archived", color: "text-gray-400", bgColor: "bg-gray-500/20" },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="border-b border-white/5 bg-gray-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/orchestration/teams">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
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
                      className="text-xl font-bold bg-gray-800 border-gray-700 text-white"
                      aria-label="Team name"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-white">{team.name}</h1>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn(dept.bgColor, dept.color, "border-0")}>
                      {dept.label}
                    </Badge>
                    <Badge className={cn(status.bgColor, status.color, "border-0")}>
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
                    className="border-gray-700 text-gray-300"
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
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {team.status === "active" ? (
                    <Button
                      variant="outline"
                      onClick={() => updateStatus("paused")}
                      className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => updateStatus("active")}
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={deleteTeam}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900/50 border border-white/10">
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
              <Card className="lg:col-span-2 p-6 bg-gray-900/50 border-white/10">
                <h3 className="font-semibold text-white mb-3">Description</h3>
                {isEditing ? (
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full h-24 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white resize-none"
                    placeholder="Describe what this team does..."
                    aria-label="Team description"
                  />
                ) : (
                  <p className="text-gray-400">
                    {team.description || "No description provided."}
                  </p>
                )}
              </Card>

              {/* Stats Card */}
              <Card className="p-6 bg-gray-900/50 border-white/10">
                <h3 className="font-semibold text-white mb-3">Team Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Members</span>
                    <span className="text-white font-medium">{team.members.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Autonomy Level</span>
                    <span className="text-white font-medium capitalize">
                      {(team.config?.autonomyLevel || "semi_autonomous").replace("_", "-")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created</span>
                    <span className="text-white font-medium">
                      {formatDistanceToNow(new Date(team.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Updated</span>
                    <span className="text-white font-medium">
                      {formatDistanceToNow(new Date(team.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Member Overview */}
            <Card className="p-6 bg-gray-900/50 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Team Members</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab("members")}
                  className="text-blue-400 hover:text-blue-300"
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
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50"
                    >
                      <div className="p-2 rounded-lg bg-violet-500/20">
                        <Bot className="h-4 w-4 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {member.agent?.name || "Unknown Agent"}
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          <span className={role.color}>{role.icon}</span>
                          <span className="text-gray-500">{role.label}</span>
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
              <h3 className="font-semibold text-white">Team Members</h3>
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
              <Card className="p-12 bg-gray-900/50 border-white/10 text-center">
                <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Members Yet</h3>
                <p className="text-gray-400 mb-6">
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
                      ? { color: "text-green-400", bg: "bg-green-400" }
                      : { color: "text-gray-400", bg: "bg-gray-400" };

                  return (
                    <Card
                      key={member.id}
                      className="p-4 bg-gray-900/50 border-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-violet-500/20">
                            <Bot className="h-6 w-6 text-violet-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">
                              {member.agent?.name || "Unknown Agent"}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={cn(
                                  "border-0 text-xs",
                                  member.role === "coordinator"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : member.role === "support"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-blue-500/20 text-blue-400"
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
                              <p className="text-xs text-gray-500 mt-1">
                                Type: {member.agent.type}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(member.id)}
                          className="text-red-400 hover:bg-red-500/10"
                          aria-label={`Remove ${member.agent?.name || "agent"} from team`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {member.agent?.description && (
                        <p className="text-sm text-gray-400 mt-3 line-clamp-2">
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
                <Card className="w-full max-w-md p-6 bg-gray-900 border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Add Team Member
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="agent-select" className="text-gray-400">
                        Select Agent
                      </Label>
                      <select
                        id="agent-select"
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white"
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
                      <Label htmlFor="role-select" className="text-gray-400">
                        Role
                      </Label>
                      <select
                        id="role-select"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white"
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
                        className="border-gray-700 text-gray-300"
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
            <Card className="p-6 bg-gray-900/50 border-white/10">
              <h3 className="font-semibold text-white mb-4">Run Team with Objective</h3>
              <p className="text-gray-400 text-sm mb-4">
                Give your team a high-level objective and they&apos;ll coordinate to accomplish it.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="objective" className="text-gray-400">
                    Objective
                  </Label>
                  <textarea
                    id="objective"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full mt-1 h-24 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white resize-none"
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
                  <p className="text-yellow-400 text-sm">
                    ⚠️ Team must be active to run. Currently: {team.status}
                  </p>
                )}
              </div>
            </Card>

            {/* Example Objectives */}
            <Card className="p-6 bg-gray-900/50 border-white/10">
              <h3 className="font-semibold text-white mb-4">Example Objectives</h3>
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
                    className="w-full text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6 bg-gray-900/50 border-white/10">
              <h3 className="font-semibold text-white mb-4">Team Configuration</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <div>
                    <p className="text-white">Autonomy Level</p>
                    <p className="text-sm text-gray-400">
                      Controls how much human oversight is required
                    </p>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400 border-0 capitalize">
                    {(team.config?.autonomyLevel || "semi_autonomous").replace("_", "-")}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <div>
                    <p className="text-white">Max Concurrent Tasks</p>
                    <p className="text-sm text-gray-400">
                      Maximum tasks the team can handle simultaneously
                    </p>
                  </div>
                  <span className="text-white font-medium">
                    {team.config?.maxConcurrentTasks || 5}
                  </span>
                </div>
                {team.config?.workingHours && (
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <div>
                      <p className="text-white">Working Hours</p>
                      <p className="text-sm text-gray-400">
                        When the team is active
                      </p>
                    </div>
                    <span className="text-white font-medium">
                      {team.config.workingHours.start} - {team.config.workingHours.end}{" "}
                      ({team.config.workingHours.timezone})
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 bg-red-950/30 border-red-500/20">
              <h3 className="font-semibold text-red-400 mb-4">Danger Zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Delete Team</p>
                  <p className="text-sm text-gray-400">
                    Permanently delete this team and remove all member associations
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={deleteTeam}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
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

