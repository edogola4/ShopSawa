// frontend/src/components/layout/Footer.js

/**
 * Professional E-commerce Footer Component
 * Features: Real payment icons, brand colors, security enhancements, DRY principles
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Phone, MapPin, ExternalLink, Truck, Shield, Headphones,
  Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Heart, ArrowUpRight,
  CreditCard, Landmark, Smartphone, Wallet2, ArrowUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../utils/constants';

// Constants for better maintainability
const FOOTER_CONFIG = {
  SCROLL_THRESHOLD: 300,
  ANIMATION_DELAY: 0.3,
  STAGGER_DELAY: 0.1,
  COMPANY_NAME: 'ShopSawa',
  COUNTRY: 'Kenya'
};

// Animation variants
const animations = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: FOOTER_CONFIG.STAGGER_DELAY,
        delayChildren: FOOTER_CONFIG.ANIMATION_DELAY
      }
    }
  },
  item: {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  },
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: FOOTER_CONFIG.ANIMATION_DELAY }
  }
};

// Secure external link handler
const createSecureExternalLinkHandler = (url) => () => {
  if (!url || typeof url !== 'string') return;
  
  // Validate URL format
  try {
    new URL(url);
  } catch {
    console.error('Invalid URL provided:', url);
    return;
  }
  
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.opener = null;
    newWindow.location = url;
  }
};

// Real payment method icons with proper SVGs
const PaymentIcons = {
  MPesa: () => (
    <svg viewBox="0 0 200 80" className="w-8 h-6">
      <rect width="200" height="80" fill="#00A651" rx="4"/>
      <text x="100" y="30" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">M-PESA</text>
      <text x="100" y="50" textAnchor="middle" fill="white" fontSize="10">by Safaricom</text>
    </svg>
  ),
  Visa: () => (
    <svg viewBox="0 0 200 80" className="w-8 h-6">
      <rect width="200" height="80" fill="#1434CB" rx="4"/>
      <text x="100" y="45" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontStyle="italic">VISA</text>
    </svg>
  ),
  Mastercard: () => (
    <svg viewBox="0 0 200 80" className="w-8 h-6">
      <rect width="200" height="80" fill="white" rx="4" stroke="#ddd"/>
      <circle cx="70" cy="40" r="20" fill="#EB001B"/>
      <circle cx="130" cy="40" r="20" fill="#F79E1B"/>
      <path d="M100 25 A20 20 0 0 1 100 55 A20 20 0 0 1 100 25" fill="#FF5F00"/>
    </svg>
  ),
  PayPal: () => (
    <svg viewBox="0 0 200 80" className="w-8 h-6">
      <rect width="200" height="80" fill="#003087" rx="4"/>
      <text x="50" y="35" fill="white" fontSize="16" fontWeight="bold">Pay</text>
      <text x="50" y="55" fill="#0070BA" fontSize="16" fontWeight="bold">Pal</text>
      <text x="120" y="45" fill="white" fontSize="20" fontWeight="bold">P</text>
    </svg>
  ),
  Airtel: () => (
    <svg viewBox="0 0 200 80" className="w-8 h-6">
      <rect width="200" height="80" fill="#E4002B" rx="4"/>
      <text x="100" y="35" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">airtel</text>
      <text x="100" y="55" textAnchor="middle" fill="white" fontSize="10">money</text>
    </svg>
  ),
  Equity: () => (
    <svg viewBox="0 0 200 80" className="w-8 h-6">
      <rect width="200" height="80" fill="#1F4E79" rx="4"/>
      <text x="100" y="30" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">EQUITY</text>
      <text x="100" y="50" textAnchor="middle" fill="white" fontSize="10">BANK</text>
    </svg>
  )
};

// Social media configuration with real brand colors
const socialMediaConfig = [
  { 
    name: 'Facebook', 
    icon: Facebook, 
    url: 'https://facebook.com/shopsawa', 
    color: '#1877F2',
    hoverColor: '#166FE5'
  },
  { 
    name: 'X', 
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    url: 'https://x.com/shopsawa', 
    color: '#000000',
    hoverColor: '#000000'
  },
  { 
    name: 'Instagram', 
    icon: Instagram, 
    url: 'https://instagram.com/shopsawa', 
    color: '#E4405F',
    hoverColor: '#E02D5B'
  },
  { 
    name: 'LinkedIn', 
    icon: Linkedin, 
    url: 'https://linkedin.com/company/shopsawa', 
    color: '#0A66C2',
    hoverColor: '#0958A5'
  },
  { 
    name: 'YouTube', 
    icon: Youtube, 
    url: 'https://youtube.com/shopsawa', 
    color: '#FF0000',
    hoverColor: '#E60000'
  },
  { 
    name: 'TikTok', 
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ), 
    url: 'https://tiktok.com/@shopsawa', 
    color: '#000000',
    hoverColor: '#333333'
  }
];

// Payment methods data
const paymentMethodsData = [
  { name: 'M-Pesa', component: PaymentIcons.MPesa },
  { name: 'Visa', component: PaymentIcons.Visa },
  { name: 'Mastercard', component: PaymentIcons.Mastercard },
  { name: 'PayPal', component: PaymentIcons.PayPal },
  { name: 'Airtel Money', component: PaymentIcons.Airtel },
  { name: 'Equity Bank', component: PaymentIcons.Equity }
];

// Features data
const featuresData = [
  { 
    icon: Truck, 
    title: 'Free Shipping', 
    description: 'On orders over KSh 2,500',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10'
  },
  { 
    icon: Shield, 
    title: 'Secure Payments', 
    description: 'SSL encrypted transactions',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10'
  },
  { 
    icon: Headphones, 
    title: '24/7 Support', 
    description: 'Customer service available',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10'
  }
];

// Footer links configuration
const footerLinksConfig = {
  shop: {
    title: 'Shop',
    links: [
      { label: 'All Products', to: ROUTES.PRODUCTS },
      { label: 'New Arrivals', to: `${ROUTES.PRODUCTS}?filter=new` },
      { label: 'Best Sellers', to: `${ROUTES.PRODUCTS}?filter=bestseller` },
      { label: 'Sale Items', to: `${ROUTES.PRODUCTS}?filter=sale` },
      { label: 'Gift Cards', to: '/gift-cards' },
      { label: 'Categories', to: '/categories' }
    ]
  },
  customer: {
    title: 'Customer Service',
    links: [
      { label: 'Help Center', to: '/help' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'Shipping Info', to: '/shipping' },
      { label: 'Returns & Refunds', to: '/returns' },
      { label: 'Size Guide', to: '/size-guide' },
      { label: 'Track Order', to: '/track-order' }
    ]
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Our Story', to: '/story' },
      { label: 'Careers', to: '/careers' },
      { label: 'Press', to: '/press' },
      { label: 'Blog', to: '/blog' },
      { label: 'Sustainability', to: '/sustainability' }
    ]
  },
  legal: {
    title: 'Legal & Privacy',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Cookie Policy', to: '/cookies' },
      { label: 'Refund Policy', to: '/refunds' },
      { label: 'Accessibility', to: '/accessibility' },
      { label: 'Consumer Rights', to: '/consumer-rights' }
    ]
  }
};

// Custom hook for scroll visibility
const useScrollVisibility = (threshold = FOOTER_CONFIG.SCROLL_THRESHOLD) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > threshold);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [threshold]);

  return isVisible;
};

// Newsletter subscription component
const NewsletterSubscription = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Successfully subscribed to our newsletter!');
      setEmail('');
    } catch (error) {
      setMessage('Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-white font-medium mb-3">Subscribe to our newsletter</h3>
      <form onSubmit={handleSubscribe} className="space-y-2">
        <div className="flex">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            disabled={isLoading}
            className="px-4 py-2 w-full rounded-l-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 rounded-r-lg text-sm font-medium transition-colors"
          >
            {isLoading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>
        {message && (
          <p className={`text-xs ${message.includes('Successfully') ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

// Social links component
const SocialLinks = () => (
  <div className="flex space-x-3">
    {socialMediaConfig.map((social) => {
      const Icon = social.icon;
      return (
        <motion.button
          key={social.name}
          onClick={createSecureExternalLinkHandler(social.url)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all group relative overflow-hidden"
          style={{ backgroundColor: social.color + '20' }}
          whileHover={{ 
            y: -3, 
            scale: 1.05,
            backgroundColor: social.color + '20'
          }}
          whileTap={{ scale: 0.95 }}
          aria-label={`Follow us on ${social.name}`}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            <Icon className="w-full h-full transition-colors" style={{ color: social.color }} />
          </div>
        </motion.button>
      );
    })}
  </div>
);

// Payment methods component with enhanced styling
const PaymentMethods = () => (
  <div className="flex items-center">
    <div className="flex flex-col space-y-2">
      <span className="text-xs font-medium text-gray-400">WE ACCEPT</span>
      <div className="flex flex-wrap gap-2">
        {paymentMethodsData.map((method) => {
          const PaymentIcon = method.component;
          return (
            <motion.div 
              key={method.name}
              className="bg-white p-1.5 rounded-md shadow-sm border border-gray-200 hover:border-blue-400 transition-all duration-200"
              whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
              title={method.name}
            >
              <PaymentIcon />
            </motion.div>
          );
        })}
      </div>
    </div>
  </div>
);

// Feature banners component
const FeatureBanners = () => (
  <div className="bg-gray-800 py-6">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuresData.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div 
              key={index}
              className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              whileHover={{ y: -3 }}
            >
              <div className={`p-3 ${feature.bgColor} rounded-full`}>
                <Icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <div>
                <h4 className="font-medium text-white">{feature.title}</h4>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  </div>
);

// Scroll to top button component
const ScrollToTopButton = ({ isVisible }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </motion.button>
  );
};

// Main Footer component
const Footer = () => {
  const { navigate } = useApp();
  const currentYear = new Date().getFullYear();
  const isScrollVisible = useScrollVisibility();

  return (
    <footer className="bg-gray-900 text-gray-300 relative overflow-hidden">
      <FeatureBanners />

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8"
          variants={animations.container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {/* Brand Section */}
          <motion.div className="lg:col-span-2" variants={animations.item}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {FOOTER_CONFIG.COMPANY_NAME}
              </h2>
            </div>
            <p className="text-gray-400 mb-6 max-w-md text-sm leading-relaxed">
              Your trusted online marketplace for quality products at unbeatable prices. 
              Shop with confidence and enjoy fast, secure delivery across {FOOTER_CONFIG.COUNTRY}.
            </p>
            
            <NewsletterSubscription />
            <SocialLinks />
          </motion.div>

          {/* Dynamic Footer Links */}
          {Object.entries(footerLinksConfig).map(([key, section]) => (
            <motion.div key={key} variants={animations.item}>
              <h3 className="text-white font-semibold mb-4 text-lg">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, index) => (
                  <motion.li 
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Link
                      to={link.to}
                      className="text-gray-400 hover:text-white transition-colors text-sm flex items-center group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-8"></div>

        {/* Bottom Bar */}
        <motion.div 
          className="flex flex-col lg:flex-row justify-between items-center pt-6 space-y-4 lg:space-y-0"
          {...animations.fadeUp}
        >
          <div className="text-sm text-gray-500">
            &copy; {currentYear} {FOOTER_CONFIG.COMPANY_NAME}. All rights reserved.
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <PaymentMethods />
            <div className="hidden sm:block h-5 w-px bg-gray-700"></div>
            <div className="flex items-center text-sm text-gray-500">
              <span>Made with</span>
              <Heart className="w-4 h-4 mx-1 text-red-500 fill-current" />
              <span>in {FOOTER_CONFIG.COUNTRY}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <ScrollToTopButton isVisible={isScrollVisible} />
    </footer>
  );
};

export default Footer;