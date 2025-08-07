import React from 'react';
import { PageContainer } from '../../components/layout/Layout';

const PrivacyPage = () => {
  const sections = [
    {
      title: '1. Introduction',
      content: (
        <>
          <p className="mb-4">
            At ShopSawa, we are committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our 
            website or use our services.
          </p>
          <p>
            Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, 
            please do not access the site or use our services.
          </p>
        </>
      )
    },
    {
      title: '2. Information We Collect',
      content: (
        <>
          <p className="mb-4">We collect several types of information from and about users of our website, including:</p>
          
          <h4 className="font-medium text-gray-800 mt-4 mb-2">Personal Information</h4>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Name, email address, phone number, and shipping/billing address</li>
            <li>Payment information (processed securely by our payment processors)</li>
            <li>Account credentials (username and password)</li>
            <li>Order history and preferences</li>
          </ul>

          <h4 className="font-medium text-gray-800 mt-4 mb-2">Non-Personal Information</h4>
          <ul className="list-disc pl-6 mb-4 space-y-1">
            <li>Browser type and version</li>
            <li>Pages you visit and time spent on our site</li>
            <li>IP address and general location data</li>
            <li>Device information and operating system</li>
          </ul>
        </>
      )
    },
    {
      title: '3. How We Use Your Information',
      content: (
        <>
          <p className="mb-4">We may use the information we collect for various purposes, including to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about your account or orders</li>
            <li>Improve our website and services</li>
            <li>Personalize your shopping experience</li>
            <li>Send promotional emails (you can opt out at any time)</li>
            <li>Prevent fraud and enhance security</li>
            <li>Comply with legal obligations</li>
          </ul>
        </>
      )
    },
    {
      title: '4. How We Share Your Information',
      content: (
        <>
          <p className="mb-4">We may share your information with:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Service providers who assist with our business operations</li>
            <li>Payment processors to complete transactions</li>
            <li>Shipping carriers to deliver your orders</li>
            <li>Law enforcement or government officials when required by law</li>
            <li>Business partners with your consent</li>
          </ul>
          <p className="mt-4">
            We do not sell your personal information to third parties for their marketing purposes without your explicit consent.
          </p>
        </>
      )
    },
    {
      title: '5. Data Security',
      content: (
        <>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect your personal information against 
            unauthorized or unlawful processing, accidental loss, destruction, or damage.
          </p>
          <p>
            While we strive to protect your personal information, no method of transmission over the internet or 
            electronic storage is 100% secure. We cannot guarantee absolute security but we work hard to protect 
            your information to the best of our ability.
          </p>
        </>
      )
    },
    {
      title: '6. Your Rights',
      content: (
        <>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Request restriction of processing</li>
            <li>Request data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact us using the information in the "Contact Us" section below.
          </p>
        </>
      )
    },
    {
      title: '7. Cookies and Tracking Technologies',
      content: (
        <>
          <p className="mb-4">
            We use cookies and similar tracking technologies to track activity on our website and hold certain information. 
            Cookies are files with a small amount of data which may include an anonymous unique identifier.
          </p>
          <p className="mb-4">
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. 
            However, if you do not accept cookies, you may not be able to use some portions of our service.
          </p>
        </>
      )
    },
    {
      title: '8. Children\'s Privacy',
      content: (
        <>
          <p>
            Our service is not intended for individuals under the age of 18. We do not knowingly collect personally 
            identifiable information from children under 18. If you are a parent or guardian and you are aware that 
            your child has provided us with personal information, please contact us.
          </p>
        </>
      )
    },
    {
      title: '9. Changes to This Privacy Policy',
      content: (
        <>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
            Privacy Policy on this page and updating the "Last updated" date.
          </p>
          <p className="mt-4">
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy 
            are effective when they are posted on this page.
          </p>
        </>
      )
    },
    {
      title: '10. Contact Us',
      content: (
        <>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <p className="mt-2">
            Email: privacy@shopsawa.com<br />
            Phone: +254 700 123 456<br />
            Address: 123 Business Street, Westlands, Nairobi, Kenya
          </p>
        </>
      )
    }
  ];

  return (
    <PageContainer className="py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: August 6, 2025</p>
        </div>

        <div className="prose max-w-none">
          {sections.map((section, index) => (
            <section key={index} className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">{section.title}</h2>
              <div className="text-gray-600">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Privacy Matters</h3>
          <p className="text-gray-600">
            We are committed to protecting your personal information and your right to privacy. 
            If you have any questions or concerns about our policy, or our practices with regards to your personal 
            information, please contact us at privacy@shopsawa.com.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default PrivacyPage;
