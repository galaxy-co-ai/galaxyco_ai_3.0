"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Components
import StepIndicator from "./StepIndicator";
import TypeSelector from "./TypeSelector";
import GuidedSession from "./GuidedSession";
import DocumentPreview from "./DocumentPreview";

// Types
import { type DocumentTypeConfig } from "./documentRequirements";

// Step definitions
const STEPS = [
  { number: 1, label: "Select Type" },
  { number: 2, label: "Guide with Neptune" },
  { number: 3, label: "Preview & Save" },
];

type CreateStep = 1 | 2 | 3;

interface CreateTabProps {
  onCreationComplete?: (document: GeneratedDocument) => void;
}

interface GeneratedDocument {
  id: string;
  title: string;
  type: string;
  sections: { id: string; type: string; content: string; editable: boolean }[];
  createdAt: Date;
  metadata: Record<string, string>;
}

export default function CreateTab({ onCreationComplete }: CreateTabProps) {
  // State
  const [currentStep, setCurrentStep] = useState<CreateStep>(1);
  const [selectedDocType, setSelectedDocType] = useState<DocumentTypeConfig | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedDocument, setSavedDocument] = useState<GeneratedDocument | null>(null);

  // Handle type selection (Step 1 → Step 2)
  const handleTypeSelect = useCallback((docType: DocumentTypeConfig) => {
    setSelectedDocType(docType);
    setCurrentStep(2);
    toast.success(`Creating ${docType.name}`, {
      description: "Neptune will guide you through the process",
    });
  }, []);

  // Handle guided session complete (Step 2 → Step 3)
  const handleGuidedComplete = useCallback((completedAnswers: Record<string, string>) => {
    setAnswers(completedAnswers);
    setCurrentStep(3);
  }, []);

  // Handle back from Step 2 to Step 1
  const handleBackToTypeSelect = useCallback(() => {
    setCurrentStep(1);
    setSelectedDocType(null);
    setAnswers({});
  }, []);

  // Handle back from Step 3 to Step 2
  const handleBackToGuided = useCallback(() => {
    setCurrentStep(2);
  }, []);

  // Handle save to collections
  const handleSaveToCollections = useCallback((document: GeneratedDocument) => {
    setSavedDocument(document);
    onCreationComplete?.(document);
    // The DocumentPreview component shows the toast
  }, [onCreationComplete]);

  // Handle create new (reset flow)
  const handleCreateNew = useCallback(() => {
    setCurrentStep(1);
    setSelectedDocType(null);
    setAnswers({});
    setSavedDocument(null);
  }, []);

  return (
    <Card className="h-full rounded-2xl shadow-sm border bg-card overflow-hidden flex flex-col">
      {/* Step Indicator Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-violet-50/80 to-purple-50/80">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Type Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <TypeSelector onSelect={handleTypeSelect} />
            </motion.div>
          )}

          {/* Step 2: Guided Session */}
          {currentStep === 2 && selectedDocType && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <GuidedSession
                docType={selectedDocType}
                onComplete={handleGuidedComplete}
                onBack={handleBackToTypeSelect}
              />
            </motion.div>
          )}

          {/* Step 3: Document Preview */}
          {currentStep === 3 && selectedDocType && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <DocumentPreview
                docType={selectedDocType}
                answers={answers}
                onBack={handleBackToGuided}
                onSaveToCollections={handleSaveToCollections}
                onCreateNew={handleCreateNew}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
