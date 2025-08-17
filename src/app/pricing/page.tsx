'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import './pricing.css';

// Define pricing plans
const pricingPlans = [
  {
    name: 'Basic',
    description: 'Essential features for small facilities',
    price: 49,
    billing: 'monthly',
    features: [
      { name: 'Up to 5 facilities', included: true },
      { name: 'Basic maintenance tracking', included: true },
      { name: 'Email support', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'Advanced analytics', included: false },
      { name: 'API access', included: false },
      { name: 'Custom integrations', included: false },
      { name: 'Dedicated account manager', included: false },
    ],
    popular: false,
    ctaText: 'Get Started',
    grainColor: 'grain-light',
  },
  {
    name: 'Professional',
    description: 'Perfect for growing organizations',
    price: 99,
    billing: 'monthly',
    features: [
      { name: 'Up to 10 facilities', included: true },
      { name: 'Advanced maintenance tracking', included: true },
      { name: 'Priority email & phone support', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'API access', included: true },
      { name: 'Custom integrations', included: false },
      { name: 'Dedicated account manager', included: false },
    ],
    popular: true,
    ctaText: 'Start Free Trial',
    grainColor: 'grain-blue',
  },
  {
    name: 'Enterprise',
    description: 'For large-scale facility management',
    price: 249,
    billing: 'monthly',
    features: [
      { name: 'Up to 20 facilities', included: true },
      { name: 'Complete maintenance suite', included: true },
      { name: '24/7 priority support', included: true },
      { name: 'Mobile app access', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'API access', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated account manager', included: true },
    ],
    popular: false,
    ctaText: 'Contact Sales',
    grainColor: 'grain-purple',
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that's right for your facility management needs.
            All plans include a 14-day free trial.
          </p>
          
          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center p-1 bg-accent/50 rounded-lg border border-border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md transition-colors ${
                billingCycle === 'monthly' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-md transition-colors ${
                billingCycle === 'annual' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual <span className="text-green-600 dark:text-green-400 text-sm font-medium">Save 20%</span>
            </button>
          </div>
        </div>
        
        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`pricing-card grain-effect ${plan.grainColor} bg-card/80 border-border ${
                plan.popular ? 'border-primary shadow-lg shadow-primary/20 popular-card-gradient' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 mt-4 mr-4">
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    ${billingCycle === 'annual' ? Math.floor(plan.price * 0.8) : plan.price}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    /{billingCycle === 'annual' ? 'year' : 'month'}
                  </span>
                  
                  {billingCycle === 'annual' && (
                    <div className="text-green-600 dark:text-green-400 text-sm mt-1">
                      Save ${Math.floor(plan.price * 0.2 * 12)} per year
                    </div>
                  )}
                </div>
                
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-start">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/50 mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Link href="/auth/sign-up" className="w-full">
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-accent hover:bg-accent/80'
                    } text-primary-foreground`}
                  >
                    {plan.ctaText}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {/* FAQ section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-card/50 border border-border">
              <h3 className="text-xl font-semibold mb-2 text-foreground">Can I change plans later?</h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes to your subscription will be prorated.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-card/50 border border-border">
              <h3 className="text-xl font-semibold mb-2 text-foreground">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, PayPal, and bank transfers for annual plans.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-card/50 border border-border">
              <h3 className="text-xl font-semibold mb-2 text-foreground">Is there a setup fee?</h3>
              <p className="text-muted-foreground">
                No, there are no setup fees or hidden charges. The price you see is the price you pay.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-card/50 border border-border">
              <h3 className="text-xl font-semibold mb-2 text-foreground">Do you offer custom plans?</h3>
              <p className="text-muted-foreground">
                Yes, for organizations with specific needs, we offer custom plans. Contact our sales team for more information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 