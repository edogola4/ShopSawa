// frontend/src/components/layout/Footer.js

/**
 * =============================================================================
 * FOOTER COMPONENT
 * =============================================================================
 * Website footer with links, contact info, and social media
 */

import React from 'react';
import { 
  Package,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  ExternalLink,
  CreditCard,
  Truck,
  Shield,
  HeadphonesIcon
} from 'lucide-react';

import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../utils/constants';

const Footer = () => {
  const { navigate } = useApp();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Story', href: '/story' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Blog', href: '/blog' }
    ],
    customer: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Shipping Info', href: '/shipping' },
      { label: 'Returns', href: '/returns' },
      { label: 'Size Guide', href: '/size-guide' }
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Refund Policy', href: '/refunds' },
      { label: 'Accessibility', href: '/accessibility' }
    ],
    shop: [
      { label: 'All Products', action: () => navigate(ROUTES.PRODUCTS) },
      { label: 'New Arrivals', action: () => navigate(ROUTES.PRODUCTS, { filter: 'new' }) },
      { label: 'Best Sellers', action: () => navigate(ROUTES.PRODUCTS, { filter: 'bestseller' }) },
      { label: 'Sale Items', action: () => navigate(ROUTES.PRODUCTS, { filter: 'sale' }) },
      { label: 'Gift Cards', href: '/gift-cards' }
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/shopsawa', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com/shopsawa', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com/shopsawa', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com/company/shopsawa', label: 'LinkedIn' },
    { icon: Youtube, href: 'https://youtube.com/shopsawa', label: 'YouTube' }
  ];

  const paymentMethods = [
    { name: 'M-Pesa', logo: '/images/mpesa-logo.png' },
    { name: 'Visa', logo: '/images/visa-logo.png' },
    { name: 'Mastercard', logo: '/images/mastercard-logo.png' }
  ];

  const handleLinkClick = (link) => {
    if (link.action) {
      link.action();
    } else if (link.href) {
      if (link.href.startsWith('http')) {
        window.open(link.href, '_blank', 'noopener,noreferrer');
      } else {
        navigate(link.href);
      }
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">ShopSawa</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Your trusted online marketplace for quality products at unbeatable prices. 
              Shop with confidence and enjoy fast, secure delivery across Kenya.
            </p>
            
            {/* Contact Information */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-sm">+254 700 123 456</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-sm">support@shopsawa.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  Westlands, Nairobi<br />
                  Kenya
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <button
                    key={social.label}
                    onClick={() => handleLinkClick(social)}
                    className="w-8 h-8 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors group"
                    aria-label={social.label}
                  >
                    <IconComponent className="w-4 h-4 group-hover:text-white" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleLinkClick(link)}
                    className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center group"
                  >
                    {link.label}
                    {link.href?.startsWith('http') && (
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-3">
              {footerLinks.customer.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleLinkClick(link)}
                    className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center group"
                  >
                    {link.label}
                    {link.href?.startsWith('http') && (
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleLinkClick(link)}
                    className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center group"
                  >
                    {link.label}
                    {link.href?.startsWith('http') && (
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-medium">Free Shipping</h4>
                <p className="text-gray-400 text-sm">On orders over KES 5,000</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-medium">Secure Payment</h4>
                <p className="text-gray-400 text-sm">Safe & secure checkout</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <HeadphonesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-medium">24/7 Support</h4>
                <p className="text-gray-400 text-sm">Always here to help</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            
            {/* Copyright */}
            <div className="text-center lg:text-left">
              <p className="text-gray-400 text-sm">
                © {currentYear} ShopSawa. All rights reserved.
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center space-x-6">
              {footerLinks.legal.map((link, index) => (
                <button
                  key={index}
                  onClick={() => handleLinkClick(link)}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">We accept:</span>
              <div className="flex items-center space-x-2">
                {/* M-Pesa Logo */}
                <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                {/* Visa/Mastercard placeholder */}
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;