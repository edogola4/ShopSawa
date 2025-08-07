import React from 'react';
import { PageContainer } from '../../components/layout/Layout';

const AccessibilityPage = () => {
  return (
    <PageContainer className="py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Accessibility Statement</h1>
          <p className="text-xl text-gray-600">
            Our commitment to making our website accessible to everyone
          </p>
        </div>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Commitment</h2>
            <p className="text-gray-600 mb-4">
              At ShopSawa, we are committed to ensuring digital accessibility for people with disabilities. 
              We are continually improving the user experience for everyone and applying the relevant 
              accessibility standards to ensure we provide equal access to all users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Conformance Status</h2>
            <p className="text-gray-600 mb-4">
              The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and 
              developers to improve accessibility for people with disabilities. We aim to meet 
              WCAG 2.1 Level AA standards for our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Accessibility Features</h2>
            <p className="text-gray-600 mb-4">
              We have implemented the following accessibility features on our website:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>Keyboard navigation support</li>
              <li>Alternative text for images</li>
              <li>Resizable text that doesn't break the layout</li>
              <li>Sufficient color contrast</li>
              <li>Logical heading structure</li>
              <li>Descriptive link text</li>
              <li>Form labels and instructions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Assistive Technologies</h2>
            <p className="text-gray-600 mb-4">
              Our website is designed to work with the following assistive technologies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>Screen readers (e.g., NVDA, VoiceOver, JAWS)</li>
              <li>Screen magnifiers</li>
              <li>Voice recognition software</li>
              <li>Keyboard navigation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Feedback</h2>
            <p className="text-gray-600 mb-4">
              We welcome your feedback on the accessibility of our website. Please let us know if you encounter 
              accessibility barriers or if you need assistance:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>Email: accessibility@shopsawa.com</li>
              <li>Phone: +254 700 123 457</li>
              <li>Postal Address: 123 Business Street, Westlands, Nairobi, Kenya</li>
            </ul>
            <p className="text-gray-600">
              We try to respond to feedback within 2 business days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Compatibility</h2>
            <p className="text-gray-600 mb-4">
              Our website is designed to be compatible with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>Latest versions of major browsers (Chrome, Firefox, Safari, Edge)</li>
              <li>Mobile devices with modern operating systems (iOS, Android)</li>
              <li>Screen readers and other assistive technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ongoing Efforts</h2>
            <p className="text-gray-600 mb-4">
              We are continually working to improve the accessibility of our website. Our ongoing efforts include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>Regular accessibility audits</li>
              <li>Training for our team on accessibility best practices</li>
              <li>Engaging with the disability community to better understand their needs</li>
              <li>Implementing accessibility improvements based on user feedback</li>
            </ul>
          </section>

          <section className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Need Help?</h2>
            <p className="text-gray-600 mb-4">
              If you need assistance with any part of our website, please don't hesitate to contact our 
              customer service team for help.
            </p>
            <a 
              href="/contact" 
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
          </section>
        </div>
      </div>
    </PageContainer>
  );
};

export default AccessibilityPage;
