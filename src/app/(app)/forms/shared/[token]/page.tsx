'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FacilitySystemFormData } from '@/types/facility';
import { FormShare } from '@/types/forms';
import SystemFormShared from '@/components/facility/SystemFormShared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SharedFormPageProps {
  params: {
    token: string;
  };
}

export default function SharedFormPage({ params }: SharedFormPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formShare, setFormShare] = useState<FormShare | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [password, setPassword] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  useEffect(() => {
    async function loadFormShare() {
      try {
        const { data, error } = await supabase
          .from('form_shares')
          .select('*')
          .eq('slug', params.token)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Form not found');

        // Check if form is expired
        if (new Date(data.expires_at) < new Date()) {
          throw new Error('This form has expired');
        }

        // Check if form has reached response limit
        if (data.response_limit && data.responses_count >= data.response_limit) {
          throw new Error('This form has reached its response limit');
        }

        setFormShare(data);
      } catch (error: any) {
        setError(error.message || 'Failed to load form');
      } finally {
        setIsLoading(false);
      }
    }

    loadFormShare();
  }, [params.token]);

  const verifyPassword = async () => {
    if (!formShare) return;

    if (password === formShare.password) {
      setIsPasswordVerified(true);
      setError(null);
    } else {
      setError('Incorrect password');
    }
  };

  const handleSubmit = async (formData: FacilitySystemFormData) => {
    if (!formShare) return;
    
    setIsSubmitting(true);
    try {
      // Create the facility system
      const { error: systemError } = await supabase
        .from('facility_systems')
        .insert({
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (systemError) throw systemError;

      // Update form share status and response count
      const { error: updateError } = await supabase
        .from('form_shares')
        .update({
          responses_count: (formShare.responses_count || 0) + 1,
          response_data: formData,
          status: formShare.response_limit && formShare.responses_count + 1 >= formShare.response_limit 
            ? 'completed' 
            : 'active'
        })
        .eq('id', formShare.id);

      if (updateError) throw updateError;

      setSubmitted(true);
    } catch (error: any) {
      setError(error.message || 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl font-semibold mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!formShare) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-900 text-xl font-semibold mb-2">Form Not Found</div>
          <div className="text-gray-600">The requested form could not be found.</div>
        </div>
      </div>
    );
  }

  if (formShare.password && !isPasswordVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <Lock className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-center mb-6">Password Protected Form</h2>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button 
              onClick={verifyPassword}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-500 text-xl font-semibold mb-2">Thank You!</div>
          <div className="text-gray-600">Your response has been submitted successfully.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SystemFormShared
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
} 