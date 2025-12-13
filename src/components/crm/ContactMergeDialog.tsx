"use client";

/**
 * ContactMergeDialog - Multi-step contact merge dialog
 * 
 * Steps:
 * 1. Select primary (target) contact and contacts to merge
 * 2. Preview conflicts and choose field values
 * 3. Confirm and execute merge
 */

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Merge,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Linkedin,
  Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  title: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  tags: string[] | null;
  customFields: Record<string, unknown> | null;
}

interface FieldConflict {
  field: string;
  targetValue: unknown;
  sourceValues: { contactId: string; value: unknown }[];
}

interface MergePreview {
  target: Contact;
  sources: Contact[];
  preview: {
    combinedTags: string[];
    combinedCustomFields: Record<string, unknown>;
    fieldsWithConflicts: FieldConflict[];
  };
}

interface ContactMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onMergeComplete?: () => void;
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  firstName: <User className="h-4 w-4" />,
  lastName: <User className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  company: <Building className="h-4 w-4" />,
  title: <Briefcase className="h-4 w-4" />,
  linkedinUrl: <Linkedin className="h-4 w-4" />,
  twitterUrl: <Twitter className="h-4 w-4" />,
};

const FIELD_LABELS: Record<string, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  phone: "Phone",
  company: "Company",
  title: "Title",
  linkedinUrl: "LinkedIn",
  twitterUrl: "Twitter",
};

export default function ContactMergeDialog({
  open,
  onOpenChange,
  contacts,
  onMergeComplete,
}: ContactMergeDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [targetContactId, setTargetContactId] = useState<string>("");
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [mergePreview, setMergePreview] = useState<MergePreview | null>(null);
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep(1);
      setTargetContactId(contacts[0]?.id || "");
      setSelectedSourceIds([]);
      setMergePreview(null);
      setFieldOverrides({});
    }
  }, [open, contacts]);

  // Auto-select other contacts as sources when target changes
  useEffect(() => {
    if (targetContactId && contacts.length > 1) {
      const otherIds = contacts.filter((c) => c.id !== targetContactId).map((c) => c.id);
      setSelectedSourceIds(otherIds);
    }
  }, [targetContactId, contacts]);

  // Fetch merge preview when moving to step 2
  const fetchPreview = useCallback(async () => {
    if (!targetContactId || selectedSourceIds.length === 0) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        targetId: targetContactId,
        sourceIds: selectedSourceIds.join(","),
      });

      const response = await fetch(`/api/crm/contacts/merge?${params}`);
      if (!response.ok) {
        throw new Error("Failed to load merge preview");
      }

      const data = await response.json();
      setMergePreview(data);

      // Initialize field overrides with target values
      const overrides: Record<string, string> = {};
      data.preview.fieldsWithConflicts.forEach((conflict: FieldConflict) => {
        overrides[conflict.field] = "target"; // Default to target value
      });
      setFieldOverrides(overrides);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load preview");
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  }, [targetContactId, selectedSourceIds]);

  // Execute merge
  const executeMerge = useCallback(async () => {
    if (!mergePreview) return;

    setIsMerging(true);
    try {
      // Build field overrides from selections
      const overrideValues: Record<string, unknown> = {};
      Object.entries(fieldOverrides).forEach(([field, selection]) => {
        if (selection !== "target") {
          // Find the source value
          const conflict = mergePreview.preview.fieldsWithConflicts.find((c) => c.field === field);
          const sourceVal = conflict?.sourceValues.find((s) => s.contactId === selection);
          if (sourceVal) {
            overrideValues[field] = sourceVal.value;
          }
        }
      });

      const response = await fetch("/api/crm/contacts/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetContactId,
          sourceContactIds: selectedSourceIds,
          fieldOverrides: Object.keys(overrideValues).length > 0 ? overrideValues : undefined,
          tagStrategy: "merge",
          customFieldStrategy: "target_priority",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to merge contacts");
      }

      const result = await response.json();
      toast.success(result.message || "Contacts merged successfully");
      onOpenChange(false);
      onMergeComplete?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to merge contacts");
    } finally {
      setIsMerging(false);
    }
  }, [mergePreview, fieldOverrides, targetContactId, selectedSourceIds, onOpenChange, onMergeComplete]);

  const handleNext = async () => {
    if (step === 1) {
      await fetchPreview();
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const getContactName = (contact: Contact) => {
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
    return name || contact.email;
  };

  const canProceed = step === 1
    ? targetContactId && selectedSourceIds.length > 0
    : step === 2
    ? mergePreview !== null
    : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5 text-primary" />
            Merge Contacts
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Select the primary contact and contacts to merge into it."}
            {step === 2 && "Review and resolve any field conflicts."}
            {step === 3 && "Confirm the merge operation."}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {s}
              </div>
              {s < 3 && (
                <ChevronRight className={cn("h-4 w-4", step > s ? "text-primary" : "text-muted-foreground")} />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="max-h-[400px] pr-4">
          {/* Step 1: Select Contacts */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Primary Contact (will be kept)</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select the contact that will remain after the merge.
                </p>
                <RadioGroup value={targetContactId} onValueChange={setTargetContactId}>
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <Card
                        key={contact.id}
                        className={cn(
                          "p-3 cursor-pointer transition-colors",
                          targetContactId === contact.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/30"
                        )}
                        onClick={() => setTargetContactId(contact.id)}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={contact.id} id={`target-${contact.id}`} />
                          <div className="flex-1">
                            <Label htmlFor={`target-${contact.id}`} className="font-medium cursor-pointer">
                              {getContactName(contact)}
                            </Label>
                            <p className="text-sm text-muted-foreground">{contact.email}</p>
                            {contact.company && (
                              <p className="text-xs text-muted-foreground">{contact.company}</p>
                            )}
                          </div>
                          {targetContactId === contact.id && (
                            <Badge className="bg-primary/10 text-primary border-primary/20">Primary</Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium">Contacts to Merge (will be deleted)</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  These contacts will be merged into the primary contact and then removed.
                </p>
                <div className="space-y-2">
                  {contacts
                    .filter((c) => c.id !== targetContactId)
                    .map((contact) => (
                      <Card
                        key={contact.id}
                        className={cn(
                          "p-3 cursor-pointer transition-colors",
                          selectedSourceIds.includes(contact.id)
                            ? "border-orange-300 bg-orange-50/50"
                            : "hover:border-muted-foreground/30"
                        )}
                        onClick={() => {
                          setSelectedSourceIds((prev) =>
                            prev.includes(contact.id)
                              ? prev.filter((id) => id !== contact.id)
                              : [...prev, contact.id]
                          );
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedSourceIds.includes(contact.id)}
                            onCheckedChange={(checked) => {
                              setSelectedSourceIds((prev) =>
                                checked
                                  ? [...prev, contact.id]
                                  : prev.filter((id) => id !== contact.id)
                              );
                            }}
                          />
                          <div className="flex-1">
                            <Label className="font-medium cursor-pointer">{getContactName(contact)}</Label>
                            <p className="text-sm text-muted-foreground">{contact.email}</p>
                            {contact.company && (
                              <p className="text-xs text-muted-foreground">{contact.company}</p>
                            )}
                          </div>
                          {selectedSourceIds.includes(contact.id) && (
                            <Badge variant="outline" className="border-orange-300 text-orange-700">
                              To merge
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview & Resolve Conflicts */}
          {step === 2 && isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {step === 2 && !isLoading && mergePreview && (
            <div className="space-y-6">
              {mergePreview.preview.fieldsWithConflicts.length === 0 ? (
                <Card className="p-6 text-center border-green-200 bg-green-50/50">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-green-800">No Conflicts Detected</h4>
                  <p className="text-sm text-green-700 mt-1">
                    All contact data can be merged automatically.
                  </p>
                </Card>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">
                      {mergePreview.preview.fieldsWithConflicts.length} field conflict(s) found
                    </span>
                  </div>
                  <div className="space-y-4">
                    {mergePreview.preview.fieldsWithConflicts.map((conflict) => (
                      <Card key={conflict.field} className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          {FIELD_ICONS[conflict.field] || <User className="h-4 w-4" />}
                          <span className="font-medium">{FIELD_LABELS[conflict.field] || conflict.field}</span>
                        </div>
                        <RadioGroup
                          value={fieldOverrides[conflict.field] || "target"}
                          onValueChange={(value) =>
                            setFieldOverrides((prev) => ({ ...prev, [conflict.field]: value }))
                          }
                        >
                          <div className="space-y-2">
                            {/* Target value option */}
                            <div
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-lg border cursor-pointer",
                                fieldOverrides[conflict.field] === "target" || !fieldOverrides[conflict.field]
                                  ? "border-primary bg-primary/5"
                                  : "hover:border-muted-foreground/30"
                              )}
                              onClick={() => setFieldOverrides((prev) => ({ ...prev, [conflict.field]: "target" }))}
                            >
                              <RadioGroupItem value="target" id={`${conflict.field}-target`} />
                              <div className="flex-1">
                                <Label htmlFor={`${conflict.field}-target`} className="cursor-pointer">
                                  <span className="text-sm font-medium">
                                    {String(conflict.targetValue) || "(empty)"}
                                  </span>
                                  <Badge className="ml-2 bg-primary/10 text-primary border-primary/20" size="sm">
                                    Primary
                                  </Badge>
                                </Label>
                              </div>
                            </div>

                            {/* Source value options */}
                            {conflict.sourceValues.map((source) => {
                              const sourceContact = mergePreview.sources.find((s) => s.id === source.contactId);
                              return (
                                <div
                                  key={source.contactId}
                                  className={cn(
                                    "flex items-center gap-3 p-2 rounded-lg border cursor-pointer",
                                    fieldOverrides[conflict.field] === source.contactId
                                      ? "border-orange-300 bg-orange-50"
                                      : "hover:border-muted-foreground/30"
                                  )}
                                  onClick={() =>
                                    setFieldOverrides((prev) => ({
                                      ...prev,
                                      [conflict.field]: source.contactId,
                                    }))
                                  }
                                >
                                  <RadioGroupItem
                                    value={source.contactId}
                                    id={`${conflict.field}-${source.contactId}`}
                                  />
                                  <div className="flex-1">
                                    <Label htmlFor={`${conflict.field}-${source.contactId}`} className="cursor-pointer">
                                      <span className="text-sm font-medium">{String(source.value)}</span>
                                      <span className="text-xs text-muted-foreground ml-2">
                                        from {getContactName(sourceContact!)}
                                      </span>
                                    </Label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </RadioGroup>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview combined tags */}
              {mergePreview.preview.combinedTags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Combined Tags</Label>
                  <div className="flex flex-wrap gap-1">
                    {mergePreview.preview.combinedTags.map((tag) => (
                      <Badge key={tag} variant="secondary" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && mergePreview && (
            <div className="space-y-6">
              <Card className="p-6 border-yellow-200 bg-yellow-50/50">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Confirm Merge</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      This action cannot be undone. The following contacts will be permanently merged:
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Primary Contact (will remain):</Label>
                  <Card className="p-3 mt-1 border-green-200 bg-green-50/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <span className="font-medium">{getContactName(mergePreview.target)}</span>
                        <span className="text-sm text-muted-foreground ml-2">{mergePreview.target.email}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">
                    Contacts to be deleted ({mergePreview.sources.length}):
                  </Label>
                  <div className="space-y-2 mt-1">
                    {mergePreview.sources.map((source) => (
                      <Card key={source.id} className="p-3 border-red-200 bg-red-50/50">
                        <div className="flex items-center gap-2">
                          <Merge className="h-4 w-4 text-red-600" />
                          <div>
                            <span className="font-medium">{getContactName(source)}</span>
                            <span className="text-sm text-muted-foreground ml-2">{source.email}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                All interactions, deals, and conversations associated with the merged contacts will be
                reassigned to the primary contact.
              </p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={isMerging}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} disabled={!canProceed || isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1" />
              )}
              {step === 1 ? "Preview Merge" : "Review & Confirm"}
            </Button>
          ) : (
            <Button onClick={executeMerge} disabled={isMerging} className="bg-red-600 hover:bg-red-700">
              {isMerging ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Merge className="h-4 w-4 mr-2" />
              )}
              Merge {mergePreview?.sources.length} Contact(s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
