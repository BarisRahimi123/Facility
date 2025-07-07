import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card-enhanced';
import { Button } from '@/components/ui/button-enhanced';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, MapPin, Share2, Plus, Star } from 'lucide-react';

export default function ModernDemo() {
  return (
    <div className="p-8 bg-background space-y-8">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">Modern UI Components</h2>
        <p className="text-muted-foreground">Enhanced shadcn/ui components with modern styling</p>
      </div>

      {/* Modern Button Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Enhanced Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="default">Default Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="gradient">Gradient</Button>
          <Button size="lg" variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Large Button
          </Button>
        </div>
      </div>

      {/* Modern Card Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Enhanced Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card hover interactive>
            <CardHeader>
              <CardTitle>Interactive Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This card has hover effects and is interactive</p>
            </CardContent>
          </Card>

          <Card gradient>
            <CardHeader>
              <CardTitle>Gradient Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This card has a subtle gradient background</p>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Modern Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This card uses the modern card class</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modern Badge Examples */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Enhanced Badges</h3>
        <div className="flex flex-wrap gap-3">
          <Badge className="badge-default">Default</Badge>
          <Badge className="badge-secondary">Secondary</Badge>
          <Badge className="badge-outline">Outline</Badge>
          <Badge className="status-active">Active</Badge>
          <Badge className="status-pending">Pending</Badge>
          <Badge className="status-inactive">Inactive</Badge>
        </div>
      </div>

      {/* Modern Facility Card Example */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Modern Facility Card</h3>
        <Card className="card-modern hover-lift max-w-sm">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">Washington Elementary</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Badge className="status-active">Active</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-[3/2] w-full rounded-md bg-muted flex items-center justify-center">
              <Building2 className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 mr-3 text-primary" />
                <span>Elementary School</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-3 text-primary" />
                <span>123 Main St, Anytown, CA</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Occupancy</p>
                  <p className="text-sm font-semibold">85%</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Star className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-sm font-semibold">4.8</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
