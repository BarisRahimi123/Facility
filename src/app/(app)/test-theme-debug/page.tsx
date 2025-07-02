'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ThemeDebugPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Theme Debug Page</h1>
      
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Current Theme Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-card-foreground">
            <strong>Current Theme:</strong> {theme}
          </div>
          
          <Button 
            onClick={toggleTheme}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Toggle to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </Button>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">CSS Variables Test:</h3>
              <div className="space-y-1 text-muted-foreground">
                <div>Background: <span style={{color: 'var(--background)'}}>■</span></div>
                <div>Foreground: <span style={{color: 'var(--foreground)'}}>■</span></div>
                <div>Primary: <span style={{color: 'var(--primary)'}}>■</span></div>
                <div>Border: <span style={{borderColor: 'var(--border)', border: '1px solid'}}>border test</span></div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Theme Classes Test:</h3>
              <div className="space-y-1">
                <div className="bg-background text-foreground p-2 rounded">Background/Foreground</div>
                <div className="bg-card text-card-foreground p-2 rounded border border-border">Card with Border</div>
                <div className="bg-accent text-accent-foreground p-2 rounded">Accent</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 