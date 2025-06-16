'use client';

import { ReactNode, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  stats?: {
    label: string;
    value: string | number;
  }[];
  sidePanel?: ReactNode;
}

export default function DashboardLayout({
  children,
  stats = [],
  sidePanel,
}: DashboardLayoutProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  return (
    <div className="h-full flex flex-col">
      {/* Quick Stats */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg border border-[#E0E0E0] shadow-sm"
            >
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className="text-2xl font-semibold mt-1">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 flex">
        {/* Main Content */}
        <div className={`flex-1 ${sidePanel ? 'mr-4' : ''}`}>{children}</div>

        {/* Side Panel */}
        {sidePanel && (
          <div
            className={`${
              isPanelOpen ? 'w-80' : 'w-0'
            } transition-all duration-300 ease-in-out hidden lg:block relative`}
          >
            <button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="absolute -left-4 top-1/2 transform -translate-y-1/2 bg-white border border-[#E0E0E0] rounded-full p-1 shadow-sm z-10"
            >
              {isPanelOpen ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
            <div
              className={`${
                isPanelOpen ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-300 h-full bg-white border border-[#E0E0E0] rounded-lg p-4 overflow-hidden`}
            >
              {sidePanel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 