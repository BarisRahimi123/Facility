export async function sendSMSMessage(to: string, body: string) {
  try {
    const response = await fetch('/api/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, body }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send SMS');
    }

    const data = await response.json();
    return data.messageId;
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    throw error;
  }
} 