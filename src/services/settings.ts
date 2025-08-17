import { createClient } from '@/lib/supabase/client';

export interface Settings {
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    enabled: boolean;
  };
}

export async function getSettings(): Promise<Settings | null> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('settings')
      .eq('id', 1)
      .single();

    if (error) throw error;
    return data?.settings || null;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
}

export async function updateSettings(settings: Settings): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ 
        id: 1,
        settings 
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating settings:', error);
    return false;
  }
}

export async function isTwilioEnabled(): Promise<boolean> {
  const settings = await getSettings();
  return settings?.twilio?.enabled || false;
}

export async function getTwilioConfig() {
  const settings = await getSettings();
  if (!settings?.twilio?.enabled) {
    throw new Error('Twilio is not enabled');
  }

  return {
    accountSid: settings.twilio.accountSid,
    authToken: settings.twilio.authToken,
    phoneNumber: settings.twilio.phoneNumber,
  };
} 