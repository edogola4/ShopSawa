// frontend/src/components/layout/Footer.js

/**
 * Modern Footer Component with responsive design and improved UX
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Phone, MapPin, ExternalLink, Truck, Shield, Headphones,
  Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Heart, ArrowUpRight,
  CreditCard, Landmark, Smartphone, Wallet2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../utils/constants';

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
};

const Footer = () => {
  const { navigate } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const currentYear = new Date().getFullYear();

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Show scroll-to-top button when scrolling down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Footer links data
  const footerLinks = {
    shop: {
      title: 'Shop',
      links: [
        { label: 'All Products', to: ROUTES.PRODUCTS },
        { label: 'New Arrivals', to: `${ROUTES.PRODUCTS}?filter=new` },
        { label: 'Best Sellers', to: `${ROUTES.PRODUCTS}?filter=bestseller` },
        { label: 'Sale Items', to: `${ROUTES.PRODUCTS}?filter=sale` },
        { label: 'Gift Cards', to: '/gift-cards' }
      ]
    },
    customer: {
      title: 'Customer Service',
      links: [
        { label: 'Help Center', to: '/help' },
        { label: 'Contact Us', to: '/contact' },
        { label: 'Shipping Info', to: '/shipping' },
        { label: 'Returns', to: '/returns' },
        { label: 'Size Guide', to: '/size-guide' }
      ]
    },
    company: {
      title: 'Company',
      links: [
        { label: 'About Us', to: '/about' },
        { label: 'Our Story', to: '/story' },
        { label: 'Careers', to: '/careers' },
        { label: 'Press', to: '/press' },
        { label: 'Blog', to: '/blog' }
      ]
    },
    legal: {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', to: '/privacy' },
        { label: 'Terms of Service', to: '/terms' },
        { label: 'Cookie Policy', to: '/cookies' },
        { label: 'Refund Policy', to: '/refunds' },
        { label: 'Accessibility', to: '/accessibility' }
      ]
    }
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/shopsawa', label: 'Facebook' },
    { 
      icon: () => (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ), 
      href: 'https://x.com/shopsawa', 
      label: 'X (Twitter)' 
    },
    { icon: Instagram, href: 'https://instagram.com/shopsawa', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com/company/shopsawa', label: 'LinkedIn' },
    { icon: Youtube, href: 'https://youtube.com/shopsawa', label: 'YouTube' },
    { icon: Github, href: 'https://github.com/yourusername/shopsawa', label: 'GitHub' }
  ];

  const paymentMethods = [
    { 
      name: 'M-Pesa', 
      icon: () => (
        <div className="w-5 h-5 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#00A651">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm5.7 9.5h-1.2c-.1 0-.3.1-.3.3v1.3c0 .2-.1.3-.3.3h-1.3c-.2 0-.3.1-.3.3v1.3c0 .2-.1.3-.3.3h-1.3c-.2 0-.3-.1-.3-.3v-1.3c0-.2-.1-.3-.3-.3H9.7c-.2 0-.3-.1-.3-.3v-1.3c0-.2-.1-.3-.3-.3H7.8c-.2 0-.3-.1-.3-.3V9.7c0-.2.1-.3.3-.3h1.3c.2 0 .3-.1.3-.3V7.8c0-.2.1-.3.3-.3h1.3c.2 0 .3.1.3.3v1.3c0 .2.1.3.3.3h1.3c.2 0 .3.1.3.3v1.3c0 .2.1.3.3.3h1.3c.2 0 .3.1.3.3v1.3c0 .2-.1.3-.3.3h-1.3c-.2 0-.3-.1-.3-.3v-1.3c0-.2-.1-.3-.3-.3h-1.3c-.2 0-.3-.1-.3-.3V9.7c0-.2-.1-.3-.3-.3H9.7c-.2 0-.3-.1-.3-.3V7.8c0-.2.1-.3.3-.3h1.3c.2 0 .3-.1.3-.3V5.9c0-.2.1-.3.3-.3h1.3c.2 0 .3.1.3.3v1.3c0 .2.1.3.3.3h1.3c.2 0 .3.1.3.3v1.3c0 .2.1.3.3.3h1.3c.2 0 .3.1.3.3v1.3c0 .2-.1.3-.3.3z"/>
          </svg>
        </div>
      ) 
    },
    { 
      name: 'Visa', 
      icon: () => (
        <div className="w-5 h-5 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1A1F71">
            <path d="M9.5 9.5h-5v5h5v-5zm1 0v5h5v-5h-5zm-6 6h5v5h-5v-5zm6 0h5v5h-5v-5z"/>
          </svg>
        </div>
      ) 
    },
    { 
      name: 'Mastercard', 
      icon: () => (
        <div className="w-5 h-5 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#000000">
            <path d="M12 6.654a6.5 6.5 0 0 0-6.5 6.5c0 3.59 2.91 6.5 6.5 6.5s6.5-2.91 6.5-6.5a6.5 6.5 0 0 0-6.5-6.5z"/>
            <path d="M12 15.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="#FF5F00"/>
          </svg>
        </div>
      ) 
    },
    { 
      name: 'PayPal', 
      icon: () => (
        <div className="w-5 h-5 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#003087">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.08c3.476 0 5.93.734 7.114 2.267.884 1.14 1.15 2.54.803 4.332-.13.67-.32 1.23-.566 1.69-.3.56-.65.98-1.02 1.27-.5.4-1.03.6-1.54.6-.35 0-.7-.12-1.05-.36-.3-.2-.54-.5-.75-.86-.36-.64-.56-1.35-.6-2.08-.02-.3.01-.59.1-.84.08-.2.18-.36.28-.47.12-.12.22-.18.3-.19.1-.01.2 0 .31.04.1.03.19.1.28.19.08.1.15.2.2.33.04.1.08.23.12.37.07.23.14.44.2.64.12.4.22.75.3 1.04.08.3.16.6.25.9.1.4.2.8.32 1.2.12.4.25.76.4 1.1.15.33.3.6.45.8.15.2.3.35.43.45.1.1.2.16.28.2.1.03.18.05.25.05h.07c.1 0 .18-.02.25-.05.08-.03.15-.1.22-.2.07-.1.14-.25.2-.45.07-.2.14-.45.2-.75.07-.3.13-.65.18-1.05.06-.4.1-.84.1-1.32 0-.6-.05-1.17-.14-1.7-.1-.54-.25-1.03-.45-1.46-.2-.43-.45-.79-.74-1.08-.3-.3-.65-.54-1.05-.72-.4-.18-.85-.3-1.35-.34-.5-.05-1.05-.07-1.64-.07h-5.3c-.3 0-.57.18-.68.45l-2.2 5.6-1.1 2.8-1.4 3.6c-.1.25-.1.5 0 .7.1.2.3.4.5.4h3.6c.5 0 .9-.4 1-.9l.2-1.2.2-1.3.2-1.2c.1-.5.5-.9 1-.9h.6c2 0 3.7-.7 5.1-2.1 1.4-1.4 2.1-3.1 2.1-5.1 0-.3 0-.5-.1-.8-.1-.3-.2-.5-.3-.7-.2-.3-.4-.5-.7-.6-.3-.2-.7-.3-1.1-.3h-7.6c-.5 0-.9.4-1 .9l-2.9 14.3c-.1.5.3 1 .8 1.1h3.7c.5 0 .9-.4 1-.9l.2-1 .2-1.1.2-1.1c.1-.5.5-.9 1-.9h.6c1.6 0 3-.6 4.1-1.7 1.1-1.1 1.7-2.5 1.7-4.1 0-.3 0-.5-.1-.8-.1-.3-.2-.5-.4-.7-.2-.2-.4-.4-.6-.5-.3-.1-.5-.2-.8-.2h-.6c-.3 0-.5.1-.7.2-.2.1-.4.3-.6.5-.2.2-.3.5-.4.8-.1.3-.2.7-.2 1 0 1.1-.4 2.1-1.2 2.8-.8.7-1.8 1.1-2.9 1.1h-.6c-.5 0-.9.4-1 .9l-.2 1.1-.2 1.1-.2 1c-.1.5-.5.9-1 .9z"/>
          </svg>
        </div>
      ) 
    }
  ];

  const features = [
    { icon: Truck, title: 'Free Shipping', description: 'On orders over $50' },
    { icon: Shield, title: 'Secure Payments', description: '100% secure payment' },
    { icon: Headphones, title: '24/7 Support', description: 'Dedicated support' }
  ];

  // Handle external links
  const handleExternalLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="bg-gray-900 text-gray-300 relative overflow-hidden">
      {/* Feature Banners */}
      <div className="bg-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={index}
                  className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  whileHover={{ y: -3 }}
                >
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <Icon className="w-6 h-6 text-blue-400" />
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

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {/* Brand Section */}
          <motion.div className="lg:col-span-2" variants={item}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                ShopSawa
              </h2>
            </div>
            <p className="text-gray-400 mb-6 max-w-md text-sm leading-relaxed">
              Your trusted online marketplace for quality products at unbeatable prices. 
              Shop with confidence and enjoy fast, secure delivery across Kenya.
            </p>
            
            {/* Newsletter Subscription */}
            <div className="mb-6">
              <h3 className="text-white font-medium mb-3">Subscribe to our newsletter</h3>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="px-4 py-2 w-full rounded-l-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r-lg text-sm font-medium transition-colors">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.button
                    key={index}
                    onClick={() => handleExternalLink(social.href)}
                    className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors group"
                    whileHover={{ y: -3, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Dynamic Footer Links */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <motion.div key={key} variants={item}>
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
          className="flex flex-col md:flex-row justify-between items-center pt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-sm text-gray-500 mb-4 md:mb-0">
            &copy; {currentYear} ShopSawa. All rights reserved.
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">We accept:</span>
              <div className="flex space-x-2">
                {paymentMethods.map((method, index) => {
                  const Icon = method.icon;
                  return (
                    <div key={index} className="bg-gray-800 p-1.5 rounded">
                      <Icon className="w-5 h-5 text-gray-400" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="h-5 w-px bg-gray-700"></div>
            <div className="flex items-center text-sm text-gray-500">
              <span>Made with</span>
              <Heart className="w-4 h-4 mx-1 text-red-500 fill-current" />
              <span>in Kenya</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll to Top Button */}
      <motion.button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Scroll to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </motion.button>
    </footer>
  );
};

export default Footer;