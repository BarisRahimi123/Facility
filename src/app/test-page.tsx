'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestPage() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Test Page</h1>
        <p className="mb-4">Count: {count}</p>
        <Button onClick={() => setCount(count + 1)}>Increment</Button>
      </div>
    </div>
  );
} 