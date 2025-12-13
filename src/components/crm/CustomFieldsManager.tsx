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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface CustomFieldDefinition {
  id: string;
  name: string;
  label: string;
  fieldType: "text" | "number" | "date" | "boolean" | "select" | "multiselect" | "textarea";
  entityType: "contact" | "deal" | "organization" | "lead";
  description: string | null;
  placeholder: string | null;
  defaultValue: unknown;
  options: string[] | null;
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

interface CustomFieldsManagerProps {
  entityType?: "contact" | "deal" | "organization" | "lead";
}

const FIELD_TYPE_ICONS = {
  text: Type,
  number: Hash,
  date: Calendar,
  boolean: ToggleLeft,
  select: List,
  multiselect: List,
  textarea: FileText,
};

const FIELD_TYPE_LABELS = {
  text: "Text",
  number: "Number",
  date: "Date",
  boolean: "Yes/No",
  select: "Single Select",
  multiselect: "Multi Select",
  textarea: "Long Text",
};

const ENTITY_TYPE_LABELS = {
  contact: "Contacts",
  deal: "Deals",
  organization: "Organizations",
  lead: "Leads",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomFieldsManager({ entityType }: CustomFieldsManagerProps) {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string>(entityType || "contact");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    label: "",
    fieldType: "text" as CustomFieldDefinition["fieldType"],
    entityType: "contact" as CustomFieldDefinition["entityType"],
    description: "",
    placeholder: "",
    options: "",
    isRequired: false,
  });

  // Fetch fields
  useEffect(() => {
    fetchFields();
  }, [selectedEntity]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedEntity !== "all") {
        params.set("entityType", selectedEntity);
      }
      const response = await fetch(`/api/crm/custom-fields?${params}`);
      if (!response.ok) throw new Error("Failed to fetch fields");
      const data = await response.json();
      setFields(data.fields || []);
    } catch (error) {
      toast.error("Failed to load custom fields");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      label: "",
      fieldType: "text",
      entityType: selectedEntity as CustomFieldDefinition["entityType"],
      description: "",
      placeholder: "",
      options: "",
      isRequired: false,
    });
    setEditingField(null);
  };

  const openEditDialog = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      label: field.label,
      fieldType: field.fieldType,
      entityType: field.entityType,
      description: field.description || "",
      placeholder: field.placeholder || "",
      options: field.options?.join(", ") || "",
      isRequired: field.isRequired,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.label) {
      toast.error("Name and label are required");
      return;
    }

    // Validate name format (snake_case)
    if (!/^[a-z][a-z0-9_]*$/.test(formData.name)) {
      toast.error("Field name must be lowercase letters, numbers, and underscores only");
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        ...formData,
        options: formData.options
          ? formData.options.split(",").map((o) => o.trim()).filter(Boolean)
          : null,
      };

      const url = editingField
        ? `/api/crm/custom-fields/${editingField.id}`
        : "/api/crm/custom-fields";
      
      const response = await fetch(url, {
        method: editingField ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save field");
      }

      toast.success(editingField ? "Field updated" : "Field created");
      setIsDialogOpen(false);
      resetForm();
      fetchFields();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save field");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (field: CustomFieldDefinition) => {
    try {
      const response = await fetch(`/api/crm/custom-fields/${field.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete field");
      
      toast.success("Field deleted");
      fetchFields();
    } catch (error) {
      toast.error("Failed to delete field");
    }
  };

  const handleToggleActive = async (field: CustomFieldDefinition) => {
    try {
      const response = await fetch(`/api/crm/custom-fields/${field.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !field.isActive }),
      });

      if (!response.ok) throw new Error("Failed to update field");
      
      fetchFields();
    } catch (error) {
      toast.error("Failed to update field");
    }
  };

  const showOptionsField = ["select", "multiselect"].includes(formData.fieldType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Fields</h3>
          <p className="text-sm text-muted-foreground">
            Define custom data fields for your CRM entities
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!entityType && (
            <Select value={selectedEntity} onValueChange={setSelectedEntity}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contact">Contacts</SelectItem>
                <SelectItem value="deal">Deals</SelectItem>
                <SelectItem value="organization">Organizations</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingField ? "Edit Custom Field" : "Create Custom Field"}
                </DialogTitle>
                <DialogDescription>
                  {editingField
                    ? "Update the custom field configuration"
                    : "Add a new custom field to capture additional data"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Field Name</Label>
                    <Input
                      id="name"
                      placeholder="custom_field"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s/g, "_") })
                      }
                      disabled={!!editingField}
                    />
                    <p className="text-xs text-muted-foreground">
                      Used in API. Lowercase, no spaces.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label">Display Label</Label>
                    <Input
                      id="label"
                      placeholder="Custom Field"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fieldType">Field Type</Label>
                    <Select
                      value={formData.fieldType}
                      onValueChange={(v) =>
                        setFormData({ ...formData, fieldType: v as CustomFieldDefinition["fieldType"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FIELD_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entityType">Entity Type</Label>
                    <Select
                      value={formData.entityType}
                      onValueChange={(v) =>
                        setFormData({ ...formData, entityType: v as CustomFieldDefinition["entityType"] })
                      }
                      disabled={!!entityType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {showOptionsField && (
                  <div className="space-y-2">
                    <Label htmlFor="options">Options</Label>
                    <Input
                      id="options"
                      placeholder="Option 1, Option 2, Option 3"
                      value={formData.options}
                      onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of options
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this field is for..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeholder">Placeholder Text</Label>
                  <Input
                    id="placeholder"
                    placeholder="Enter a value..."
                    value={formData.placeholder}
                    onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Required Field</Label>
                    <p className="text-xs text-muted-foreground">
                      Make this field mandatory
                    </p>
                  </div>
                  <Switch
                    checked={formData.isRequired}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isRequired: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingField ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Fields List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : fields.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No custom fields defined yet</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first field
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {fields.map((field) => {
            const Icon = FIELD_TYPE_ICONS[field.fieldType] || Type;
            return (
              <Card
                key={field.id}
                className={`transition-opacity ${!field.isActive ? "opacity-60" : ""}`}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{field.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {FIELD_TYPE_LABELS[field.fieldType]}
                      </Badge>
                      {field.isRequired && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {!field.isActive && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {field.name} • {ENTITY_TYPE_LABELS[field.entityType]}
                      {field.description && ` • ${field.description}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(field)}
                      title={field.isActive ? "Deactivate" : "Activate"}
                    >
                      <ToggleLeft
                        className={`h-4 w-4 ${field.isActive ? "text-green-600" : "text-muted-foreground"}`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(field)}
                    >
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
                          <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{field.label}&quot;? This will
                            remove all data stored in this field across all records.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(field)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
