import React from 'react';
import { PageContainer } from '../../components/layout/Layout';

const FAQPage = () => {
  const faqSections = [
    {
      id: 'shipping',
      title: 'Shipping & Delivery',
      items: [
        {
          question: 'How long does delivery take?',
          answer: 'Standard delivery within Kenya typically takes 2-5 business days. Delivery times may vary depending on your location and the delivery method selected at checkout.'
        },
        {
          question: 'What are the shipping costs?',
          answer: 'We offer free standard shipping on all orders over KSh 2,500. For orders below this amount, a flat rate of KSh 300 applies. Express delivery options are available at checkout for an additional fee.'
        },
        {
          question: 'Do you offer international shipping?',
          answer: 'Currently, we only ship within Kenya. We plan to expand our shipping options to other East African countries in the near future.'
        },
        {
          question: 'How can I track my order?',
          answer: 'Once your order has been shipped, you will receive a confirmation email with a tracking number and a link to track your package. You can also track your order by logging into your account.'
        }
      ]
    },
    {
      id: 'returns',
      title: 'Returns & Exchanges',
      items: [
        {
          question: 'What is your return policy?',
          answer: 'We accept returns within 30 days of delivery for most items in their original condition with tags attached. Some items may have different return policies which will be noted on the product page.'
        },
        {
          question: 'How do I initiate a return?',
          answer: 'To initiate a return, please log in to your account, go to your order history, and select the item(s) you wish to return. Follow the prompts to complete the return request.'
        },
        {
          question: 'When will I receive my refund?',
          answer: 'Once we receive and inspect your return, we will process your refund within 5-7 business days. Refunds will be issued to the original payment method used for the purchase.'
        },
        {
          question: 'Do you offer exchanges?',
          answer: 'Yes, we offer exchanges for items of equal or lesser value. If you would like to exchange an item, please indicate this when initiating your return.'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Pricing',
      items: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept M-Pesa, Visa, Mastercard, PayPal, Airtel Money, and Equity Bank payments. All transactions are processed securely through our payment partners.'
        },
        {
          question: 'Is it safe to use my credit/debit card on your website?',
          answer: 'Yes, we use industry-standard encryption and security measures to protect your payment information. We do not store your full credit card details on our servers.'
        },
        {
          question: 'Do you offer installment payment options?',
          answer: 'Yes, we offer flexible payment options through our partners. Look for the "Pay in Installments" option at checkout for eligible purchases.'
        },
        {
          question: 'Why was my payment declined?',
          answer: 'Payments may be declined for various reasons including insufficient funds, incorrect card details, or security measures by your bank. Please verify your payment information and try again, or contact your bank for assistance.'
        }
      ]
    },
    {
      id: 'sizing',
      title: 'Sizing & Product Information',
      items: [
        {
          question: 'How do I know what size to order?',
          answer: 'We provide detailed size charts for all clothing and footwear. Please refer to the size guide available on each product page for accurate measurements.'
        },
        {
          question: 'Are the product colors accurate?',
          answer: 'We make every effort to display product colors as accurately as possible. However, actual colors may vary slightly due to monitor settings and lighting conditions.'
        },
        {
          question: 'Do you sell authentic products?',
          answer: 'Yes, we only sell 100% authentic products sourced directly from authorized distributors and brands.'
        },
        {
          question: 'How can I care for my purchase?',
          answer: 'Care instructions are provided on the product label or description. For specific care instructions, please refer to the product details or contact our customer service team.'
        }
      ]
    },
    {
      id: 'account',
      title: 'Account & Orders',
      items: [
        {
          question: 'How do I create an account?',
          answer: 'Click on the "Sign Up" button at the top of the page and follow the prompts to create your account. You can also create an account during the checkout process.'
        },
        {
          question: 'I forgot my password. How can I reset it?',
          answer: 'Click on the "Forgot Password" link on the login page and enter your email address. You will receive instructions to reset your password.'
        },
        {
          question: 'How do I check the status of my order?',
          answer: 'You can check your order status by logging into your account and viewing your order history. You will also receive email updates with tracking information once your order has been shipped.'
        },
        {
          question: 'Can I cancel or modify my order?',
          answer: 'You may be able to cancel or modify your order if it has not yet been processed for shipping. Please contact our customer service team immediately for assistance.'
        }
      ]
    },
    {
      id: 'other',
      title: 'Other Questions',
      items: [
        {
          question: 'Do you have physical stores?',
          answer: 'Currently, we operate exclusively online. This allows us to keep our prices competitive and offer a wider selection of products.'
        },
        {
          question: 'How can I contact customer service?',
          answer: 'You can reach our customer service team by email at support@shopsawa.com or by calling +254 700 123 456. Our team is available Monday to Friday, 8:00 AM to 6:00 PM EAT.'
        },
        {
          question: 'Do you offer gift cards?',
          answer: 'Yes, we offer electronic gift cards that can be purchased online and sent directly to the recipient via email.'
        },
        {
          question: 'What is your privacy policy?',
          answer: 'We are committed to protecting your privacy. Please review our Privacy Policy for detailed information about how we collect, use, and protect your personal information.'
        }
      ]
    }
  ];

  return (
    <PageContainer className="py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600">Find answers to common questions about our products and services</p>
        </div>

        <div className="space-y-12">
          {faqSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200">
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.items.map((item, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{item.question}</h3>
                    <p className="text-gray-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 p-6 bg-blue-50 rounded-lg text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-3">Still have questions?</h3>
          <p className="text-gray-600 mb-4">
            Our customer service team is here to help you with any other questions you may have.
          </p>
          <a
            href="/contact"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </PageContainer>
  );
};

export default FAQPage;
