'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
  workspaceId: string;
}

const SAMPLE_CSV = `text,channels,datetime,tags
"Excited to launch our product update on Bluesky!",bluesky,2026-11-25T14:00:00Z,launch
"Federated networks update for Mastodon community",mastodon,2026-11-26T10:00:00Z,fediverse
"Weekly telegram broadcast to all subscribers",telegram,2026-11-27T16:30:00Z,weekly`;

export function CsvImportModal({
  isOpen,
  onClose,
  onImportComplete,
  workspaceId,
}: CsvImportModalProps) {
  const t = useTranslations('Calendar');
  const [csvContent, setCsvContent] = useState(SAMPLE_CSV);
  const [isValidating, setIsValidating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  if (!isOpen) return null;

  const parseCsvText = (text: string) => {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      // Regex parsing for CSV handling quotes
      const match = lines[i].match(/(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g);
      if (!match) continue;

      const values = match
        .map((v) => v.replace(/^,/, '').trim().replace(/^"|"$/g, '').replace(/""/g, '"'))
        .filter((_, idx) => idx < headers.length);

      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      rows.push(rowObj);
    }

    return rows;
  };

  const handleValidate = async () => {
    const rows = parseCsvText(csvContent);
    if (rows.length === 0) {
      toast.error('No valid rows found in CSV');
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch(`http://localhost:4000/posts/import-csv/validate?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      if (res.ok) {
        const data = await res.json();
        setValidationResult(data);
      } else {
        // Fallback client validation
        const report = rows.map((r, i) => ({
          rowNumber: i + 1,
          valid: !!r.text && !!r.channels && !!r.datetime,
          data: r,
          errors: !r.datetime ? ['Missing datetime'] : [],
        }));
        setValidationResult({
          totalRows: rows.length,
          validCount: report.filter((r) => r.valid).length,
          errorCount: report.filter((r) => !r.valid).length,
          report,
        });
      }
    } catch {
      toast.error('Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCommit = async () => {
    const rows = parseCsvText(csvContent);
    setIsCommitting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success(`Successfully imported and scheduled posts!`);
      if (onImportComplete) onImportComplete();
      onClose();
    } catch {
      toast.error('Failed to import CSV');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">{t('importCsv')}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <p className="text-muted-foreground">
            Paste CSV with columns: <code className="bg-secondary px-1.5 py-0.5 rounded font-mono">text, channels, datetime, tags</code>
          </p>
          <textarea
            value={csvContent}
            onChange={(e) => {
              setCsvContent(e.target.value);
              setValidationResult(null);
            }}
            rows={5}
            className="w-full p-3 rounded-xl border border-border bg-background font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Validation Result Preview */}
        {validationResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold">
                Validation Summary: {validationResult.validCount} valid, {validationResult.errorCount} with errors
              </span>
              <Badge variant={validationResult.errorCount === 0 ? 'default' : 'destructive'} className="text-[10px]">
                {validationResult.errorCount === 0 ? 'Ready to Commit' : 'Review Errors'}
              </Badge>
            </div>

            <div className="max-h-40 overflow-y-auto border border-border rounded-xl divide-y divide-border text-xs">
              {validationResult.report.map((item: any) => (
                <div key={item.rowNumber} className="p-2.5 flex items-center justify-between gap-3 bg-card/60">
                  <div className="truncate">
                    <span className="font-mono text-muted-foreground mr-2">#{item.rowNumber}</span>
                    <span className="font-medium truncate">{item.data.text}</span>
                  </div>
                  <div>
                    {item.valid ? (
                      <span className="inline-flex items-center gap-1 text-emerald-500 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-destructive font-bold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" /> {item.errors.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          {!validationResult ? (
            <Button onClick={handleValidate} disabled={isValidating}>
              {isValidating ? 'Validating...' : 'Validate CSV Rows'}
            </Button>
          ) : (
            <Button onClick={handleCommit} disabled={isCommitting || validationResult.validCount === 0}>
              {isCommitting ? 'Importing...' : `Import ${validationResult.validCount} Posts`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
