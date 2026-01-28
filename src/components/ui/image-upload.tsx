import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  currentUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square';
  placeholder?: React.ReactNode;
  className?: string;
}

export function ImageUpload({
  currentUrl,
  onUpload,
  onRemove,
  size = 'md',
  shape = 'circle',
  placeholder,
  className,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      setUploading(true);
      try {
        await onRemove();
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className={cn('relative group', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={cn(
          sizeClasses[size],
          shape === 'circle' ? 'rounded-full' : 'rounded-lg',
          'relative overflow-hidden flex items-center justify-center',
          'bg-secondary/50 border-2 border-dashed border-border',
          'hover:border-primary hover:bg-secondary/70 transition-all',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          uploading && 'cursor-not-allowed opacity-50'
        )}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : currentUrl ? (
          <img
            src={currentUrl}
            alt=""
            className={cn(
              'w-full h-full object-cover',
              shape === 'circle' ? 'rounded-full' : 'rounded-lg'
            )}
          />
        ) : (
          placeholder || <Camera className="w-5 h-5 text-muted-foreground" />
        )}

        {/* Overlay on hover */}
        {currentUrl && !uploading && (
          <div className={cn(
            'absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity',
            'flex items-center justify-center',
            shape === 'circle' ? 'rounded-full' : 'rounded-lg'
          )}>
            <Camera className="w-5 h-5 text-white" />
          </div>
        )}
      </button>

      {/* Remove button */}
      {currentUrl && onRemove && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
