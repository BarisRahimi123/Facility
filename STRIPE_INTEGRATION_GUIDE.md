# Stripe Payment Integration Guide

This guide provides step-by-step instructions for integrating Stripe payment processing into the FacilityCore reservation system.

## Overview

The reservation system is designed to collect payment during the checkout process. Users must be authenticated before proceeding to payment to ensure proper tracking and communication.

## Prerequisites

- Stripe account (create at https://stripe.com)
- Next.js application with TypeScript
- Supabase backend for storing payment records

## Installation

### 1. Install Required Packages

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Implementation Steps

### 1. Create Payment Intent API Route

Create `/src/app/api/stripe/create-payment-intent/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, reservationData } = body;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: user.id,
        userEmail: user.email!,
        reservationData: JSON.stringify(reservationData),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
```

### 2. Create Payment Component

Create `/src/components/stripe/PaymentForm.tsx`:

```typescript
import { useState } from 'react';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({ amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      onError(error.message || 'Payment failed');
    } else {
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full mt-4"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  );
}

export function PaymentForm({ amount, onSuccess, onError }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState('');

  // Fetch payment intent client secret
  useEffect(() => {
    fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret))
      .catch((err) => onError(err.message));
  }, [amount]);

  if (!clientSecret) {
    return <div>Loading payment form...</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
```

### 3. Update FacilityRentalModal

Replace the TODO section in `FacilityRentalModal.tsx` with:

```typescript
import { PaymentForm } from '@/components/stripe/PaymentForm';

// Add state for payment step
const [showPayment, setShowPayment] = useState(false);

// Update handleSubmitReservation to show payment form
const handleSubmitReservation = async () => {
  try {
    // Create reservation in pending state
    const reservationResponse = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart,
        checkoutData,
        status: 'pending_payment',
      }),
    });

    if (!reservationResponse.ok) {
      throw new Error('Failed to create reservation');
    }

    const { reservationId } = await reservationResponse.json();
    
    // Store reservation ID for payment metadata
    setCurrentReservationId(reservationId);
    
    // Show payment form
    setShowPayment(true);
  } catch (error) {
    console.error('Reservation error:', error);
    alert('Failed to create reservation. Please try again.');
  }
};

// Add payment success handler
const handlePaymentSuccess = async () => {
  // Update reservation status to confirmed
  await fetch(`/api/reservations/${currentReservationId}/confirm`, {
    method: 'POST',
  });
  
  // Show success message and close modal
  alert('Payment successful! Your reservation is confirmed.');
  onClose();
};
```

### 4. Create Webhook Handler

Create `/src/app/api/stripe/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Update reservation status
      const reservationData = JSON.parse(paymentIntent.metadata.reservationData);
      await supabase
        .from('reservations')
        .update({ 
          status: 'confirmed',
          payment_status: 'paid',
          stripe_payment_intent_id: paymentIntent.id,
        })
        .eq('id', reservationData.reservationId);
      
      // Send confirmation email
      // TODO: Implement email notification
      
      break;

    case 'payment_intent.payment_failed':
      // Handle failed payment
      break;
  }

  return NextResponse.json({ received: true });
}
```

## Database Schema Updates

Add these columns to your `reservations` table:

```sql
ALTER TABLE reservations ADD COLUMN stripe_payment_intent_id TEXT;
ALTER TABLE reservations ADD COLUMN payment_method TEXT;
ALTER TABLE reservations ADD COLUMN payment_amount DECIMAL(10,2);
ALTER TABLE reservations ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE;
```

## Testing

### Test Cards

- Success: `4242 4242 4242 4242`
- Requires authentication: `4000 0025 0000 3155`
- Declined: `4000 0000 0000 9995`

### Webhook Testing

Use Stripe CLI for local testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Security Considerations

1. **Never expose secret keys**: Only use `STRIPE_SECRET_KEY` in server-side code
2. **Validate amounts**: Always calculate amounts on the server
3. **Use webhooks**: Don't rely on client-side callbacks for critical operations
4. **Enable HTTPS**: Stripe requires HTTPS in production
5. **PCI Compliance**: Use Stripe Elements to avoid handling card details

## Calendar Synchronization

When a payment succeeds:

1. Reservation status changes to 'confirmed'
2. Calendar availability is automatically updated
3. All users (staff, admin, renters) see the updated availability
4. Email notifications are sent to relevant parties

## Next Steps

1. Implement email notifications for successful bookings
2. Add refund functionality
3. Create admin dashboard for payment management
4. Implement recurring payment support for long-term rentals
5. Add support for partial payments/deposits 