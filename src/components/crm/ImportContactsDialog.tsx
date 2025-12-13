'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type ImportState = 'idle' | 'uploading' | 'success' | 'error';

interface ImportResult {
  imported: number;
  errors?: { row: number; error: string }[];
  message: string;
}

export function ImportContactsDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportContactsDialogProps) {
  const [state, setState] = useState<ImportState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setState('uploading');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/crm/contacts/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setState('success');
      setResult(data);
      toast.success(data.message);
      onSuccess();
    } catch (error) {
      setState('error');
      setResult({
        imported: 0,
        message: error instanceof Error ? error.message : 'Import failed',
      });
      toast.error('Failed to import contacts');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const downloadTemplate = () => {
    const headers = 'First Name,Last Name,Email,Phone,Title,Company,LinkedIn URL,Twitter URL,Tags,Notes';
    const exampleRow = 'John,Doe,john@example.com,555-1234,CEO,Acme Inc,https://linkedin.com/in/johndoe,,customer;vip,Important contact';
    const csv = `${headers}\n${exampleRow}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAndClose = () => {
    setState('idle');
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Contacts
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import contacts into your CRM.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {state === 'idle' && (
            <>
              {/* Drop Zone */}
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="font-medium text-gray-700">
                  Drop your CSV file here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Template Download */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Need a template?</p>
                  <p className="text-xs text-muted-foreground">
                    Download our CSV template with all supported columns
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-1" />
                  Template
                </Button>
              </div>

              {/* Supported Fields */}
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Supported columns:</p>
                <p>
                  First Name, Last Name, Email*, Phone, Title, Company, LinkedIn URL, Twitter URL, Tags, Notes
                </p>
                <p className="mt-1 italic">* Email is required</p>
              </div>
            </>
          )}

          {state === 'uploading' && (
            <div className="text-center py-8">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="font-medium">Importing contacts...</p>
              <p className="text-sm text-muted-foreground">
                This may take a moment for large files
              </p>
            </div>
          )}

          {state === 'success' && result && (
            <div className="text-center py-6">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-medium text-lg">Import Complete!</p>
              <p className="text-muted-foreground mt-1">
                {result.imported} contacts imported successfully
              </p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 text-left bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-800">
                    {result.errors.length} rows skipped due to errors
                  </p>
                  <ul className="mt-2 text-xs text-amber-700 space-y-1">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>Row {err.row}: {err.error}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>...and {result.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
              <Button className="mt-4" onClick={resetAndClose}>
                Done
              </Button>
            </div>
          )}

          {state === 'error' && result && (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <p className="font-medium text-lg">Import Failed</p>
              <p className="text-muted-foreground mt-1">{result.message}</p>
              <Button className="mt-4" onClick={() => setState('idle')}>
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

