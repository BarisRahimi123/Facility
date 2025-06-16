'use client';

import { useState } from 'react';

export default function TestSimplePage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">App is Working!</h1>
        <p className="text-gray-400 mb-8">This page loads without any authentication issues.</p>
        <div className="space-y-4">
          <a 
            href="/facilities" 
            className="block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
          >
            Go to Facilities
          </a>
          <a 
            href="/auth/sign-in-simple" 
            className="block bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    </div>
  );
} 