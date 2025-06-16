'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LottieAnimation } from '@/components/ui/lottie-animation';
import { 
  Building2, 
  ClipboardCheck, 
  Users, 
  BarChart3, 
  Calendar, 
  FileText,
  ArrowRight,
  CheckCircle2,
  LucideIcon,
  Clock,
  Globe
} from 'lucide-react';
import { GlassNavbar } from '@/components/ui/glass-navbar';

// Import animation data
const animationData = require('../../public/animations/lottie/anim1.json');
const penAnimationData = require('../../public/animations/lottie/Pen.json');
const docusAnimationData = require('../../public/animations/lottie/docs.json');
const managerAnimationData = require('../../public/animations/lottie/manager.json');
const virtualTourAnimationData = require('../../public/animations/lottie/virtualT.json');

interface Feature {
  icon?: LucideIcon;
  title: string;
  description: string;
  isSpecial?: boolean;
  animation?: any;
}

export default function LandingPage() {
  const router = useRouter();

  const features: Feature[] = [
    {
      icon: Building2,
      title: 'Facility Management',
      description: 'Streamline your facility operations with our comprehensive management tools.'
    },
    {
      icon: ClipboardCheck,
      title: 'Maintenance Tracking',
      description: 'Keep track of all maintenance tasks and schedules in one place.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Enable seamless collaboration between facility managers and staff.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reporting',
      description: 'Get detailed insights into your facility\'s performance and operations.'
    },
    {
      icon: Calendar,
      title: 'Scheduling',
      description: 'Efficiently manage and schedule all facility-related activities.'
    },
    {
      isSpecial: true,
      title: 'Document Management',
      description: 'Organize and access all your facility documents securely.',
      animation: docusAnimationData
    }
  ];

  const benefits = [
    'Real-time facility monitoring',
    'Automated maintenance scheduling',
    'Mobile-friendly interface',
    'Customizable reporting',
    'Secure data storage',
    '24/7 support access'
  ];

  const companies = [
    'Mendota Unified',
    'Manchester Mall',
    'Centeral Unified',
    'La Habara Unified',
    'Woodlake Unified'
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <GlassNavbar />
      
      {/* Hero Section */}
      <div className="pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              Run Every Facility{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Like a Pro
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto lg:mx-0 leading-relaxed">
              FacilityCore puts all your operations in one place—so you stay ahead of issues, reduce chaos, and grow with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
              <Button 
                size="lg"
                onClick={() => router.push('/auth/sign-up')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-full px-8 py-3 text-lg font-medium"
              >
                Try For Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white rounded-full px-8 py-3 text-lg font-medium"
              >
                Watch Demo
              </Button>
            </div>
          </div>
          <div className="relative w-full max-w-2xl mx-auto">
            <div className="aspect-square w-full">
              <LottieAnimation 
                animationData={animationData}
                className="w-full h-full"
                loop={true}
                autoplay={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Companies Section */}
      <div className="py-16 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <p className="text-center text-gray-400 mb-8">Trusted by leading educational institutions and facilities</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 md:gap-x-16">
            {companies.map((company, index) => (
              <div key={index} className="text-gray-400 font-medium text-lg hover:text-gray-300 transition-colors">
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Facility Manager Empowerment Section */}
      <div className="py-24 bg-gradient-to-b from-transparent to-gray-900/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative w-full max-w-xl mx-auto">
              <div className="aspect-square w-full">
                <LottieAnimation 
                  animationData={managerAnimationData}
                  className="w-full h-full"
                  loop={true}
                  autoplay={true}
                />
              </div>
            </div>
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/10 mb-6">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Empower Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Facility Team
                </span>
              </h3>
              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                We help facility managers centralize and streamline all critical information, 
                enabling seamless collaboration with consultants, maintenance teams, and stakeholders. 
                Make informed decisions, prevent costly errors, and optimize both construction and 
                operations with real-time insights and comprehensive data management.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <p className="text-gray-300">Seamless collaboration with maintenance teams and consultants</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <p className="text-gray-300">Real-time communication with stakeholders</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <p className="text-gray-300">Prevent costly construction and operation errors</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <p className="text-gray-300">Comprehensive master planning integration</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-full px-8 py-3 text-lg font-medium"
                >
                  Start Collaborating
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documentation Overview Section */}
      <div className="py-24 bg-gradient-to-b from-transparent to-gray-900/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative w-full max-w-xl mx-auto order-last lg:order-first">
              <div className="aspect-square w-full">
                <LottieAnimation 
                  animationData={penAnimationData}
                  className="w-full h-full"
                  loop={true}
                  autoplay={true}
                />
              </div>
            </div>
            <div className="text-center lg:text-left order-first lg:order-last">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Streamline Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Documentation
                </span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed mb-8">
                Keep all your facility documentation organized, accessible, and up-to-date. 
                From maintenance records to compliance documents, everything is just a click away.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-full px-8 py-3 text-lg font-medium"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gradient-to-b from-gray-900/50 to-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful features for modern facilities
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to manage your facilities efficiently and scale your operations
            </p>
          </div>

          {/* Document Management Feature */}
          <div className="mb-32">
            {/* Main Feature Highlight */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/10 mb-6">
                  <FileText className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-6">
                  Document{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    Management
                  </span>
                </h3>
                <p className="text-xl text-gray-300 leading-relaxed mb-8">
                  Organize and access all your facility documents securely. Our powerful document 
                  management system ensures that every file is properly stored, versioned, and 
                  easily retrievable when needed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-full px-8 py-3 text-lg font-medium"
                  >
                    Learn More
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="relative w-full max-w-xl mx-auto">
                <div className="aspect-square w-full">
                  <LottieAnimation 
                    animationData={docusAnimationData}
                    className="w-full h-full"
                    loop={true}
                    autoplay={true}
                  />
                </div>
              </div>
            </div>

            {/* Virtual Tour Feature */}
            <div className="mb-32 pt-16 border-t border-gray-800/30">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/10 mb-6">
                    <Building2 className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-6">
                    Virtual{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      Facility Tours
                    </span>
                  </h3>
                  <p className="text-xl text-gray-300 leading-relaxed mb-8">
                    Transform how you collaborate with stakeholders through immersive virtual facility tours. 
                    Save significant time and resources by enabling remote site visits, efficient planning, 
                    and real-time decision making—all without the need for physical presence.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                      <p className="text-gray-300">Reduce travel costs and time for stakeholders</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                      <p className="text-gray-300">Enable instant community engagement</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                      <p className="text-gray-300">Facilitate remote planning meetings</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                      <p className="text-gray-300">Accelerate decision-making process</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-full px-8 py-3 text-lg font-medium"
                    >
                      Take a Tour
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="relative w-full max-w-xl mx-auto">
                  <div className="aspect-square w-full">
                    <LottieAnimation 
                      animationData={virtualTourAnimationData}
                      className="w-full h-full"
                      loop={true}
                      autoplay={true}
                    />
                  </div>
                </div>
              </div>

              {/* Virtual Tour Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-purple-600/10">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <h4 className="text-lg font-semibold">Stakeholder Engagement</h4>
                  </div>
                  <p className="text-gray-300">
                    Engage stakeholders effectively with immersive virtual tours that provide detailed facility insights.
                  </p>
                </div>
                <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-purple-600/10">
                      <Clock className="w-6 h-6 text-purple-400" />
                    </div>
                    <h4 className="text-lg font-semibold">Time & Cost Savings</h4>
                  </div>
                  <p className="text-gray-300">
                    Eliminate travel expenses and reduce project timelines with virtual collaboration tools.
                  </p>
                </div>
                <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-purple-600/10">
                      <Globe className="w-6 h-6 text-purple-400" />
                    </div>
                    <h4 className="text-lg font-semibold">Community Access</h4>
                  </div>
                  <p className="text-gray-300">
                    Provide transparent facility access to the community while maintaining security.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 rounded-lg bg-purple-600/10">
                    <CheckCircle2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-lg font-semibold">Centralized Storage</h4>
                </div>
                <p className="text-gray-300">
                  Store all your documents in one secure location with easy access and version control.
                </p>
              </div>
              <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 rounded-lg bg-purple-600/10">
                    <CheckCircle2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-lg font-semibold">Smart Search</h4>
                </div>
                <p className="text-gray-300">
                  Find any document instantly with powerful search and filtering capabilities.
                </p>
              </div>
              <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 rounded-lg bg-purple-600/10">
                    <CheckCircle2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-lg font-semibold">Secure Sharing</h4>
                </div>
                <p className="text-gray-300">
                  Share documents securely with team members and stakeholders with granular permissions.
                </p>
              </div>
            </div>
          </div>

          {/* We'll add other features here following the same pattern */}
          {/* Each feature will have its own section with animation and detail cards */}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                Why choose FacilityCore?
              </h2>
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 text-green-400 mr-4 flex-shrink-0 mt-1" />
                    <p className="text-lg text-gray-300">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 rounded-2xl border border-gray-700/50">
              <h3 className="text-2xl font-semibold text-white mb-4">
                Ready to get started?
              </h3>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Join thousands of facility managers who trust FacilityCore for their operations.
              </p>
              <Button 
                size="lg"
                onClick={() => router.push('/auth/sign-up')}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-full py-3 text-lg font-medium"
              >
                Start free trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">FacilityCore</h3>
              <p className="text-gray-400 leading-relaxed">
                Modern facility management platform for your operations
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/auth/sign-in" className="text-gray-400 hover:text-white transition">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-up" className="text-gray-400 hover:text-white transition">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-gray-400 hover:text-white transition">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">Contact</h3>
              <p className="text-gray-400 leading-relaxed">
                Email: support@facilitycore.com<br />
                Phone: (555) 123-4567
              </p>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2024 FacilityCore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 