import { Building2 } from 'lucide-react';
import { GlassNavbar } from '@/components/ui/glass-navbar';

export function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar />
      
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-muted/20" />
        
        <div className="relative w-full max-w-md space-y-8">
          <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border p-8 shadow-lg">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="h-8 bg-muted rounded-lg mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded-lg w-2/3 mx-auto animate-pulse" />
            </div>

            <div className="mt-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="h-4 bg-muted rounded w-1/4 mb-2 animate-pulse" />
                  <div className="h-10 bg-muted rounded-lg animate-pulse" />
                </div>
                <div>
                  <div className="h-4 bg-muted rounded w-1/4 mb-2 animate-pulse" />
                  <div className="h-10 bg-muted rounded-lg animate-pulse" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                  <div className="ml-2 h-4 bg-muted rounded w-20 animate-pulse" />
                </div>
                <div className="h-4 bg-muted rounded w-32 animate-pulse" />
              </div>

              <div className="h-12 bg-muted rounded-xl animate-pulse" />
              
              <div className="text-center">
                <div className="h-4 bg-muted rounded w-2/3 mx-auto animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 