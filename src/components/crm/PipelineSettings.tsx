"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  GitBranch,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Settings2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  description: string | null;
  color: string;
  displayOrder: number;
  probability: number;
  stageType: "open" | "won" | "lost";
  dealCount: number;
  totalValue: number;
  isActive: boolean;
}

interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  stages: PipelineStage[];
  createdAt: string;
}

// ============================================================================
// STAGE TYPE CONFIG
// ============================================================================

const STAGE_TYPE_CONFIG = {
  open: { label: "Open", icon: GitBranch, color: "text-blue-600 bg-blue-50" },
  won: { label: "Won", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
  lost: { label: "Lost", icon: XCircle, color: "text-red-600 bg-red-50" },
};

const STAGE_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#64748b", // Slate
];

// ============================================================================
// SORTABLE STAGE ITEM
// ============================================================================

function SortableStageItem({
  stage,
  onEdit,
  onDelete,
}: {
  stage: PipelineStage;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const TypeConfig = STAGE_TYPE_CONFIG[stage.stageType];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-card p-3 ${
        isDragging ? "shadow-lg ring-2 ring-primary" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div
        className="h-4 w-4 rounded-full"
        style={{ backgroundColor: stage.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{stage.name}</span>
          <Badge
            variant="outline"
            className={`text-xs ${TypeConfig.color}`}
          >
            {TypeConfig.label}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {stage.probability}%
          </Badge>
        </div>
        {stage.description && (
          <p className="text-xs text-muted-foreground truncate">
            {stage.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>{stage.dealCount} deals</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Stage</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{stage.name}&quot;?
                {stage.dealCount > 0 && (
                  <span className="block mt-2 text-amber-600">
                    Warning: {stage.dealCount} deals are in this stage and will need
                    to be moved.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ============================================================================
// PIPELINE CARD
// ============================================================================

function PipelineCard({
  pipeline,
  onUpdate,
  onDelete,
  onRefresh,
}: {
  pipeline: Pipeline;
  onUpdate: (data: Partial<Pipeline>) => Promise<void>;
  onDelete: () => Promise<void>;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [stages, setStages] = useState(pipeline.stages);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [saving, setSaving] = useState(false);

  // Stage form state
  const [stageForm, setStageForm] = useState({
    name: "",
    description: "",
    color: "#6366f1",
    probability: 50,
    stageType: "open" as PipelineStage["stageType"],
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    setStages(pipeline.stages);
  }, [pipeline.stages]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    const newStages = arrayMove(stages, oldIndex, newIndex);
    setStages(newStages);

    // Save new order
    try {
      const response = await fetch(
        `/api/crm/pipelines/${pipeline.id}/stages`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stageOrder: newStages.map((s) => s.id),
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to reorder stages");
    } catch (error) {
      toast.error("Failed to save stage order");
      setStages(pipeline.stages); // Revert
    }
  };

  const openEditStage = (stage: PipelineStage) => {
    setEditingStage(stage);
    setStageForm({
      name: stage.name,
      description: stage.description || "",
      color: stage.color,
      probability: stage.probability,
      stageType: stage.stageType,
    });
    setIsStageDialogOpen(true);
  };

  const resetStageForm = () => {
    setStageForm({
      name: "",
      description: "",
      color: "#6366f1",
      probability: 50,
      stageType: "open",
    });
    setEditingStage(null);
  };

  const handleSaveStage = async () => {
    if (!stageForm.name) {
      toast.error("Stage name is required");
      return;
    }

    try {
      setSaving(true);
      const url = editingStage
        ? `/api/crm/pipelines/${pipeline.id}/stages/${editingStage.id}`
        : `/api/crm/pipelines/${pipeline.id}/stages`;

      const response = await fetch(url, {
        method: editingStage ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stageForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save stage");
      }

      toast.success(editingStage ? "Stage updated" : "Stage created");
      setIsStageDialogOpen(false);
      resetStageForm();
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save stage");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      const response = await fetch(
        `/api/crm/pipelines/${pipeline.id}/stages/${stageId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete stage");
      toast.success("Stage deleted");
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete stage");
    }
  };

  return (
    <Card className={!pipeline.isActive ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                {pipeline.isDefault && (
                  <Badge variant="secondary">Default</Badge>
                )}
                {!pipeline.isActive && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Inactive
                  </Badge>
                )}
              </div>
              {pipeline.description && (
                <CardDescription>{pipeline.description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Pipeline Settings</DialogTitle>
                  <DialogDescription>
                    Configure pipeline settings and defaults
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Pipeline Name</Label>
                    <Input defaultValue={pipeline.name} disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Set as Default</Label>
                      <p className="text-xs text-muted-foreground">
                        New deals will use this pipeline
                      </p>
                    </div>
                    <Switch
                      checked={pipeline.isDefault}
                      onCheckedChange={(checked) =>
                        onUpdate({ isDefault: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Active</Label>
                      <p className="text-xs text-muted-foreground">
                        Deactivate to hide from selection
                      </p>
                    </div>
                    <Switch
                      checked={pipeline.isActive}
                      onCheckedChange={(checked) =>
                        onUpdate({ isActive: checked })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Delete Pipeline
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Pipeline</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the pipeline and all its
                          stages. Deals will need to be reassigned.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={onDelete}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={stages.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {stages.map((stage) => (
                  <SortableStageItem
                    key={stage.id}
                    stage={stage}
                    onEdit={() => openEditStage(stage)}
                    onDelete={() => handleDeleteStage(stage.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <Dialog
              open={isStageDialogOpen}
              onOpenChange={(open) => {
                setIsStageDialogOpen(open);
                if (!open) resetStageForm();
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-2">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Stage
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingStage ? "Edit Stage" : "Add Stage"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Stage Name</Label>
                    <Input
                      value={stageForm.name}
                      onChange={(e) =>
                        setStageForm({ ...stageForm, name: e.target.value })
                      }
                      placeholder="e.g., Qualification"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={stageForm.description}
                      onChange={(e) =>
                        setStageForm({ ...stageForm, description: e.target.value })
                      }
                      placeholder="Optional description..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Stage Type</Label>
                      <Select
                        value={stageForm.stageType}
                        onValueChange={(v) =>
                          setStageForm({
                            ...stageForm,
                            stageType: v as PipelineStage["stageType"],
                            probability: v === "won" ? 100 : v === "lost" ? 0 : stageForm.probability,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="won">Won (Closed)</SelectItem>
                          <SelectItem value="lost">Lost (Closed)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex flex-wrap gap-1">
                        {STAGE_COLORS.map((color) => (
                          <button
                            key={color}
                            className={`h-6 w-6 rounded-full border-2 ${
                              stageForm.color === color
                                ? "border-foreground"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setStageForm({ ...stageForm, color })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Win Probability</Label>
                      <span className="text-sm font-medium">
                        {stageForm.probability}%
                      </span>
                    </div>
                    <Slider
                      value={[stageForm.probability]}
                      onValueChange={([v]) =>
                        setStageForm({ ...stageForm, probability: v })
                      }
                      max={100}
                      step={5}
                      disabled={stageForm.stageType !== "open"}
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for revenue forecasting
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsStageDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveStage} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingStage ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PipelineSettings() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPipeline, setNewPipeline] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchPipelines = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/crm/pipelines");
      if (!response.ok) throw new Error("Failed to fetch pipelines");
      const data = await response.json();
      setPipelines(data.pipelines || []);
    } catch (error) {
      toast.error("Failed to load pipelines");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePipeline = async () => {
    if (!newPipeline.name) {
      toast.error("Pipeline name is required");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/crm/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPipeline),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create pipeline");
      }

      toast.success("Pipeline created with default stages");
      setIsCreateDialogOpen(false);
      setNewPipeline({ name: "", description: "" });
      fetchPipelines();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create pipeline");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePipeline = async (id: string, data: Partial<Pipeline>) => {
    try {
      const response = await fetch(`/api/crm/pipelines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update pipeline");
      fetchPipelines();
    } catch (error) {
      toast.error("Failed to update pipeline");
    }
  };

  const handleDeletePipeline = async (id: string) => {
    try {
      const response = await fetch(`/api/crm/pipelines/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete pipeline");
      toast.success("Pipeline deleted");
      fetchPipelines();
    } catch (error) {
      toast.error("Failed to delete pipeline");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Deal Pipelines</h3>
          <p className="text-sm text-muted-foreground">
            Configure sales pipelines and customize deal stages
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Pipeline</DialogTitle>
              <DialogDescription>
                Create a new sales pipeline with default stages
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Pipeline Name</Label>
                <Input
                  value={newPipeline.name}
                  onChange={(e) =>
                    setNewPipeline({ ...newPipeline, name: e.target.value })
                  }
                  placeholder="e.g., Enterprise Sales"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newPipeline.description}
                  onChange={(e) =>
                    setNewPipeline({ ...newPipeline, description: e.target.value })
                  }
                  placeholder="Optional description..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePipeline} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Pipeline
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipelines List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : pipelines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No pipelines configured</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first pipeline
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pipelines.map((pipeline) => (
            <PipelineCard
              key={pipeline.id}
              pipeline={pipeline}
              onUpdate={(data) => handleUpdatePipeline(pipeline.id, data)}
              onDelete={() => handleDeletePipeline(pipeline.id)}
              onRefresh={fetchPipelines}
            />
          ))}
        </div>
      )}
    </div>
  );
}
