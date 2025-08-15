import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Users, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisibilityToggleProps {
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  entityType?: 'facility' | 'building' | 'room' | 'field';
  className?: string;
}

export function VisibilityToggle({
  isPublic,
  onToggle,
  disabled = false,
  size = 'md',
  showLabel = true,
  entityType = 'facility',
  className
}: VisibilityToggleProps) {
  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base'
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className="text-sm font-medium text-foreground">
          Visibility:
        </span>
      )}
      
      <Button
        variant={isPublic ? "default" : "outline"}
        size={size}
        onClick={() => onToggle(!isPublic)}
        disabled={disabled}
        className={cn(
          "transition-all duration-200",
          sizeClasses[size],
          isPublic 
            ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
            : "bg-muted hover:bg-muted/80 text-muted-foreground border-border"
        )}
      >
        {isPublic ? (
          <>
            <Users className={cn("mr-1.5", iconSizeClasses[size])} />
            Public
          </>
        ) : (
          <>
            <Lock className={cn("mr-1.5", iconSizeClasses[size])} />
            Private
          </>
        )}
      </Button>

      {showLabel && (
        <div className="flex items-center gap-1">
          <Badge 
            variant={isPublic ? "default" : "secondary"}
            className={cn(
              "text-xs",
              isPublic 
                ? "bg-green-100 text-green-800 border-green-300" 
                : "bg-gray-100 text-gray-600 border-gray-300"
            )}
          >
            {isPublic ? (
              <>
                <Eye className="mr-1 h-3 w-3" />
                Visible on maps
              </>
            ) : (
              <>
                <EyeOff className="mr-1 h-3 w-3" />
                Staff only
              </>
            )}
          </Badge>
        </div>
      )}

      {showLabel && (
        <span className="text-xs text-muted-foreground max-w-xs">
          {isPublic 
            ? `This ${entityType} will appear on public facility maps for all users to discover and reserve.`
            : `This ${entityType} will only be visible to staff and administrators. Regular users won't see it on public maps.`
          }
        </span>
      )}
    </div>
  );
}

// Simplified version for use in tables/cards
export function VisibilityBadge({ 
  isPublic, 
  className 
}: { 
  isPublic: boolean; 
  className?: string; 
}) {
  return (
    <Badge 
      variant={isPublic ? "default" : "secondary"}
      className={cn(
        "text-xs font-medium",
        isPublic 
          ? "bg-green-100 text-green-800 border-green-300" 
          : "bg-gray-100 text-gray-600 border-gray-300",
        className
      )}
    >
      {isPublic ? (
        <>
          <Eye className="mr-1 h-3 w-3" />
          Public
        </>
      ) : (
        <>
          <EyeOff className="mr-1 h-3 w-3" />
          Private
        </>
      )}
    </Badge>
  );
}