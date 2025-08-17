'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';

export async function checkSMSConsent({ userId, phoneNumber }: { userId?: string; phoneNumber: string }): Promise<{
  canSend: boolean;
  consentRecordId?: string;
  reason?: string;
}> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      console.error('Supabase client not initialized');
      return { canSend: false, reason: 'Service not configured' };
    }

    // Build query
    let query = supabase
      .from('sms_consent_records')
      .select('id, verified_at, expires_at, consent_status')
      .eq('phone_number', phoneNumber.replace(/\D/g, ''))
      .eq('consent_status', 'active');

    // If userId provided, also check by user
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return { canSend: false, reason: 'No active consent found' };
    }

    // Check if consent is verified
    if (!data.verified_at) {
      return { 
        canSend: false, 
        consentRecordId: data.id,
        reason: 'Consent not verified' 
      };
    }

    // Check if consent has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { 
        canSend: false, 
        consentRecordId: data.id,
        reason: 'Consent expired' 
      };
    }

    return { 
      canSend: true, 
      consentRecordId: data.id 
    };
  } catch (error) {
    console.error('Error checking SMS consent:', error);
    return { canSend: false, reason: 'Error checking consent' };
  }
}

export async function logSMSAttempt({
  userId,
  phoneNumber,
  messageType,
  messageContent,
  consentRecordId,
  sendSuccessful,
  twilioMessageId,
  errorMessage
}: {
  userId?: string;
  phoneNumber: string;
  messageType: string;
  messageContent: string;
  consentRecordId?: string;
  sendSuccessful: boolean;
  twilioMessageId?: string;
  errorMessage?: string;
}) {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    await supabase
      .from('sms_message_log')
      .insert({
        consent_record_id: consentRecordId,
        phone_number: phoneNumber.replace(/\D/g, ''),
        message_type: messageType as any,
        message_content: messageContent,
        twilio_message_sid: twilioMessageId,
        status: sendSuccessful ? 'sent' : 'failed',
        error_message: errorMessage
      });
  } catch (error) {
    console.error('Error logging SMS attempt:', error);
  }
}

export async function verifySMSConsent(phoneNumber: string, token: string) {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Service not configured');
    }

    // Find consent record with matching token
    const { data: consent, error: fetchError } = await supabase
      .from('sms_consent_records')
      .select('id')
      .eq('phone_number', phoneNumber.replace(/\D/g, ''))
      .eq('verification_token', token)
      .eq('consent_status', 'active')
      .single();

    if (fetchError || !consent) {
      return { success: false, error: 'Invalid verification token' };
    }

    // Update verification status
    const { error: updateError } = await supabase
      .from('sms_consent_records')
      .update({
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', consent.id);

    if (updateError) {
      throw updateError;
    }

    // Log verification
    await supabase
      .from('sms_consent_history')
      .insert({
        consent_record_id: consent.id,
        phone_number: phoneNumber.replace(/\D/g, ''),
        action: 'verify',
        source: 'sms_reply'
      });

    return { success: true, message: 'Phone number verified successfully' };
  } catch (error) {
    console.error('Error verifying SMS consent:', error);
    return { success: false, error: 'Failed to verify consent' };
  }
}

export async function getAllSMSConsents(organizationId?: string) {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Service not configured');
    }

    let query = supabase
      .from('sms_consent_records')
      .select(`
        *,
        user:users(name, email, organization_id)
      `)
      .order('created_at', { ascending: false });

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq('user.organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { success: true, consents: data || [] };
  } catch (error) {
    console.error('Error fetching SMS consents:', error);
    return { success: false, error: 'Failed to fetch consent records' };
  }
}

export async function exportConsentRecords(format: 'csv' | 'json' = 'csv') {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Service not configured');
    }

    const { data, error } = await supabase
      .from('sms_consent_records')
      .select(`
        phone_number,
        full_name,
        email,
        consent_status,
        message_types,
        consent_text,
        page_url,
        consented_at,
        verified_at,
        revoked_at,
        ip_address
      `)
      .order('consented_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (format === 'json') {
      return {
        success: true,
        data: JSON.stringify(data, null, 2),
        filename: `sms-consent-records-${new Date().toISOString()}.json`
      };
    }

    // Convert to CSV
    if (!data || data.length === 0) {
      return { success: false, error: 'No records to export' };
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(record => 
      Object.values(record).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      ).join(',')
    );

    const csv = [headers, ...rows].join('\n');

    return {
      success: true,
      data: csv,
      filename: `sms-consent-records-${new Date().toISOString()}.csv`
    };
  } catch (error) {
    console.error('Error exporting consent records:', error);
    return { success: false, error: 'Failed to export records' };
  }
}