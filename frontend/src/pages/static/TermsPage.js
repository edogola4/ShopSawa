import React from 'react';
import { PageContainer } from '../../components/layout/Layout';

const TermsPage = () => {
  const sections = [
    {
      title: '1. Introduction',
      content: (
        <>
          <p className="mb-4">
            Welcome to ShopSawa! These Terms of Service ("Terms") govern your access to and use of the ShopSawa website, 
            mobile applications, and services (collectively, the "Service") operated by ShopSawa ("us", "we", or "our").
          </p>
          <p>
            By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the 
            terms, then you may not access the Service.
          </p>
        </>
      )
    },
    {
      title: '2. Accounts',
      content: (
        <>
          <p className="mb-4">
            When you create an account with us, you must provide accurate, complete, and current information. 
            You are responsible for safeguarding the password that you use to access the Service and for any 
            activities or actions under your password.
          </p>
          <p>
            You agree not to disclose your password to any third party. You must notify us immediately upon becoming 
            aware of any breach of security or unauthorized use of your account.
          </p>
        </>
      )
    },
    {
      title: '3. Orders and Payments',
      content: (
        <>
          <p className="mb-4">
            All orders are subject to acceptance and availability. Prices are shown in Kenyan Shillings (KES) and are 
            inclusive of all taxes unless otherwise stated.
          </p>
          <p className="mb-4">
            We accept various payment methods including M-Pesa, credit/debit cards, and mobile money. By placing an order, 
            you confirm that the payment details provided are valid and correct.
          </p>
          <p>
            We reserve the right to refuse or cancel any order for any reason, including but not limited to product 
            availability, errors in the description or price of the product, or error in your order.
          </p>
        </>
      )
    },
    {
      title: '4. Shipping and Delivery',
      content: (
        <>
          <p className="mb-4">
            We aim to process and ship all orders within 1-2 business days. Delivery times may vary depending on your 
            location and the delivery method selected at checkout.
          </p>
          <p>
            Risk of loss and title for items purchased from our Service pass to you upon delivery to the carrier. 
            You are responsible for filing any claims with carriers for damaged or lost shipments.
          </p>
        </>
      )
    },
    {
      title: '5. Returns and Refunds',
      content: (
        <>
          <p className="mb-4">
            We accept returns within 30 days of delivery for most items in their original condition. 
            Some products may have different return policies or requirements.
          </p>
          <p>
            To initiate a return, please contact our customer service team. Once your return is received and inspected, 
            we will send you an email to notify you that we have received your returned item.
          </p>
        </>
      )
    },
    {
      title: '6. Intellectual Property',
      content: (
        <>
          <p className="mb-4">
            The Service and its original content, features, and functionality are and will remain the exclusive property 
            of ShopSawa and its licensors. Our trademarks and trade dress may not be used in connection with any product 
            or service without the prior written consent of ShopSawa.
          </p>
        </>
      )
    },
    {
      title: '7. Limitation of Liability',
      content: (
        <>
          <p className="mb-4">
            In no event shall ShopSawa, nor its directors, employees, partners, agents, suppliers, or affiliates, 
            be liable for any indirect, incidental, special, consequential or punitive damages, including without 
            limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Your access to or use of or inability to access or use the Service</li>
            <li>Any conduct or content of any third party on the Service</li>
            <li>Any content obtained from the Service</li>
            <li>Unauthorized access, use or alteration of your transmissions or content</li>
          </ul>
        </>
      )
    },
    {
      title: '8. Governing Law',
      content: (
        <>
          <p>
            These Terms shall be governed and construed in accordance with the laws of Kenya, without regard to its 
            conflict of law provisions. Any disputes arising under or in connection with these Terms shall be subject 
            to the exclusive jurisdiction of the courts located in Nairobi.
          </p>
        </>
      )
    },
    {
      title: '9. Changes to Terms',
      content: (
        <>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
            We will provide at least 30 days' notice prior to any new terms taking effect. 
            By continuing to access or use our Service after those revisions become effective, 
            you agree to be bound by the revised terms.
          </p>
        </>
      )
    },
    {
      title: '10. Contact Us',
      content: (
        <>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p className="mt-2">
            Email: legal@shopsawa.com<br />
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Acceptance of Terms</h3>
          <p className="text-gray-600 mb-4">
            By using our Service, you acknowledge that you have read, understood, and agree to be bound by these 
            Terms of Service. If you do not agree to these terms, please do not use our Service.
          </p>
          <p className="text-gray-600">
            Your continued use of the Service following the posting of any changes to these Terms constitutes 
            acceptance of those changes.
          </p>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            If you have any questions about these Terms, please don't hesitate to contact our support team.
          </p>
          <a 
            href="/contact" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </PageContainer>
  );
};

export default TermsPage;
