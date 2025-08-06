// frontend/src/pages/RegisterPage.js

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShoppingBag, Users, Star, Shield, CheckCircle, ArrowLeft, Sparkles, Gift, Clock, Headphones } from 'lucide-react';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../context/AuthContext';

// Constants for better maintainability
const BRAND_CONFIG = {
  name: 'ShopSawa',
  tagline: 'Join thousands of happy shoppers',
  description: 'Create your account today and unlock exclusive deals, personalized recommendations, and a seamless shopping experience.',
};

const STATS_DATA = [
  { icon: Users, value: '50,000+', label: 'Active Members', color: 'text-emerald-400' },
  { icon: Star, value: '4.9/5', label: 'Customer Rating', color: 'text-yellow-400' },
  { icon: Shield, value: '100%', label: 'Secure Platform', color: 'text-blue-400' }
];

const MEMBER_BENEFITS = [
  { icon: Gift, text: 'Exclusive member-only discounts up to 40%' },
  { icon: Clock, text: 'Early access to flash sales and new arrivals' },
  { icon: Sparkles, text: 'AI-powered personalized recommendations' },
  { icon: CheckCircle, text: 'Real-time order tracking and history' },
  { icon: Headphones, text: '24/7 priority customer support' },
  { icon: Shield, text: 'Advanced security and data protection' }
];

const TRUST_INDICATORS = [
  { icon: Shield, text: 'SSL Secured' },
  { icon: Star, text: '4.9★ Rating' },
  { icon: Users, text: '50K+ Members' }
];

// Reusable Components
const Logo = ({ variant = 'default', className = '' }) => {
  const isLight = variant === 'light';
  
  return (
    <div className={`flex items-center ${className}`}>
      <div className={`w-10 h-10 ${isLight ? 'bg-white' : 'bg-gradient-to-br from-purple-600 to-pink-600'} rounded-xl flex items-center justify-center mr-3 shadow-lg`}>
        <ShoppingBag className={`w-6 h-6 ${isLight ? 'text-purple-600' : 'text-white'}`} />
      </div>
      <span className={`text-2xl font-bold ${isLight ? 'text-white' : 'text-gray-900'}`}>
        {BRAND_CONFIG.name}
      </span>
    </div>
  );
};

const StatCard = ({ stat, index }) => {
  const Icon = stat.icon;
  
  return (
    <div 
      className="flex items-center group transform transition-all duration-300 hover:scale-105"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 group-hover:bg-opacity-30 transition-all duration-300">
        <Icon className={`w-7 h-7 ${stat.color}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white drop-shadow-sm">{stat.value}</div>
        <div className="text-purple-200 text-sm font-medium">{stat.label}</div>
      </div>
    </div>
  );
};

const BenefitItem = ({ benefit, index, compact = false }) => {
  const Icon = benefit.icon;
  
  if (compact) {
    return (
      <div className="flex items-center text-xs text-gray-700">
        <Icon className="w-3 h-3 text-purple-500 mr-2 flex-shrink-0" />
        <span className="truncate">{benefit.text.split(' ').slice(0, 3).join(' ')}...</span>
      </div>
    );
  }
  
  return (
    <div 
      className="flex items-start text-purple-100 group opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 100 + 800}ms`, animationFillMode: 'forwards' }}
    >
      <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center mr-4 mt-0.5 group-hover:scale-110 transition-transform duration-200">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="leading-relaxed">{benefit.text}</span>
    </div>
  );
};

const TrustIndicator = ({ indicator }) => {
  const Icon = indicator.icon;
  
  return (
    <div className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200">
      <Icon className="w-3 h-3 mr-1" />
      <span>{indicator.text}</span>
    </div>
  );
};

const WelcomeMessage = ({ redirectTo }) => {
  if (!redirectTo || redirectTo === '/') return null;
  
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
      <div className="flex items-start">
        <CheckCircle className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-purple-900 mb-1">Almost there!</p>
          <p className="text-xs text-purple-700">
            Create your account to complete checkout and unlock exclusive member benefits.
          </p>
        </div>
      </div>
    </div>
  );
};

const MobileBenefits = () => (
  <div className="lg:hidden mb-6 p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-xl border border-purple-100 shadow-sm">
    <div className="flex items-center mb-3">
      <Sparkles className="w-4 h-4 text-purple-600 mr-2" />
      <h3 className="text-sm font-bold text-gray-900">Member Benefits</h3>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {MEMBER_BENEFITS.slice(0, 4).map((benefit, index) => (
        <BenefitItem key={index} benefit={benefit} index={index} compact />
      ))}
    </div>
  </div>
);

const BrandingSide = () => (
  <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-700 via-pink-600 to-indigo-700 relative overflow-hidden">
    {/* Background Effects */}
    <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40"></div>
    <div className="absolute inset-0 opacity-30" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat'
    }}></div>
    
    {/* Content */}
    <div className="relative flex flex-col justify-center px-12 text-white z-10">
      <div className="max-w-md">
        {/* Logo */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <Logo variant="light" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold mb-6 leading-tight opacity-0 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          {BRAND_CONFIG.tagline}
        </h1>
        
        <p className="text-lg text-purple-100 mb-8 leading-relaxed opacity-0 animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
          {BRAND_CONFIG.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 mb-10">
          {STATS_DATA.map((stat, index) => (
            <StatCard key={index} stat={stat} index={index} />
          ))}
        </div>

        {/* Benefits */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold mb-6 text-white opacity-0 animate-fade-in" style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}>
            What you'll unlock:
          </h3>
          {MEMBER_BENEFITS.map((benefit, index) => (
            <BenefitItem key={index} benefit={benefit} index={index} />
          ))}
        </div>
      </div>
    </div>

    {/* Decorative Elements */}
    <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-white/10 to-white/5 rounded-full -translate-y-36 translate-x-36 blur-sm"></div>
    <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-white/10 to-white/5 rounded-full translate-y-28 -translate-x-28 blur-sm"></div>
    <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-white/5 rounded-full animate-pulse"></div>
    <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
  </div>
);

const FormSide = ({ redirectTo, handleRegisterSuccess }) => (
  <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-gradient-to-br from-gray-50 to-white">
    <div className="mx-auto w-full max-w-sm lg:w-96">
      {/* Mobile Logo */}
      <div className="lg:hidden mb-8">
        <Logo className="justify-center" />
      </div>

      {/* Welcome Message */}
      <WelcomeMessage redirectTo={redirectTo} />

      {/* Mobile Benefits */}
      <MobileBenefits />

      {/* Registration Form */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600 text-sm">Join our community of happy shoppers</p>
        </div>
        
        <RegisterForm onSuccess={handleRegisterSuccess} redirectTo={redirectTo} />
      </div>

      {/* Navigation */}
      <div className="mt-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to {BRAND_CONFIG.name}
        </Link>
      </div>

      {/* Trust Indicators */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 mb-3 font-medium">Trusted by 50,000+ customers worldwide</p>
        <div className="flex items-center justify-center space-x-6">
          {TRUST_INDICATORS.map((indicator, index) => (
            <TrustIndicator key={index} indicator={indicator} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Main Component
const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const redirectTo = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (user) {
      navigate(redirectTo);
    }
  }, [user, navigate, redirectTo]);

  const handleRegisterSuccess = () => {
    navigate(redirectTo);
  };

  return (
    <div className="min-h-screen flex">
      <BrandingSide />
      <FormSide redirectTo={redirectTo} handleRegisterSuccess={handleRegisterSuccess} />
      
      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;