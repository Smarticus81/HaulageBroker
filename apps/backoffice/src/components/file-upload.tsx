'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

interface FileUploadProps {
  onUpload?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
}

export function FileUpload({
  onUpload,
  accept = '.pdf,.png,.jpg,.jpeg,.tiff',
  multiple = true,
  maxSize = 25 * 1024 * 1024,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const newFiles: UploadedFile[] = [];
      const rawFiles: File[] = [];

      Array.from(fileList).forEach((file) => {
        if (file.size > maxSize) {
          newFiles.push({
            id: `${Date.now()}-${file.name}`,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'error',
            error: `File exceeds ${formatSize(maxSize)} limit`,
          });
        } else {
          const uploadFile: UploadedFile = {
            id: `${Date.now()}-${file.name}`,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'uploading',
          };
          newFiles.push(uploadFile);
          rawFiles.push(file);

          // Simulate upload progress
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10 + Math.random() * 20;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id ? { ...f, progress: 100, status: 'complete' } : f,
                ),
              );
            } else {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id ? { ...f, progress: Math.min(progress, 99) } : f,
                ),
              );
            }
          }, 300);
        }
      });

      setFiles((prev) => [...prev, ...newFiles]);
      if (rawFiles.length > 0) onUpload?.(rawFiles);
    },
    [maxSize, onUpload],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    processFiles(e.dataTransfer.files);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50',
        )}
      >
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">
          Drop files here or <span className="text-blue-600">browse</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">
          PDF, PNG, JPG, TIFF up to {formatSize(maxSize)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => processFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg"
            >
              <File className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate">{file.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
                  {file.status === 'uploading' && (
                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {file.status === 'uploading' && (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                )}
                {file.status === 'complete' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="p-0.5 rounded hover:bg-slate-200 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
