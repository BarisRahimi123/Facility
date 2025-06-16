'use server';

import { Twilio } from 'twilio';
import { getTwilioConfig } from '@/services/settings';

// Create a more resilient Twilio client factory
function createTwilioClient(accountSid: string, authToken: string) {
  return new Twilio(accountSid, authToken, {
    edge: 'umatilla', // Use edge deployment for better performance
    lazyLoading: true, // Enable lazy loading to avoid initialization issues
    logLevel: 'debug' // Enable debug logging in development
  });
}

export async function sendSMS(to: string, body: string): Promise<string> {
  try {
    const config = await getTwilioConfig();
    const client = createTwilioClient(config.accountSid, config.authToken);

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(to)) {
      throw new Error('Invalid phone number format. Must be in E.164 format (e.g., +1234567890)');
    }

    // Send message
    const message = await client.messages.create({
      body,
      from: config.phoneNumber,
      to,
    });

    return message.sid;
  } catch (error: any) {
    console.error('SMS sending error:', error);
    throw new Error(error.message || 'Failed to send SMS');
  }
} 