import React from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/Layout';

const AboutPage = () => {
  return (
    <PageContainer className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About ShopSawa</h1>
        
        <div className="prose max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Story</h2>
            <p className="text-gray-600 mb-4">
              Founded in 2025, ShopSawa was born out of a simple idea: to make online shopping more accessible, 
              reliable, and enjoyable for everyone in Kenya. What started as a small team of passionate individuals 
              has grown into a trusted e-commerce platform serving thousands of happy customers across the country.
            </p>
            <p className="text-gray-600">
              Our mission is to provide a seamless shopping experience with a wide selection of quality products, 
              competitive prices, and exceptional customer service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Customer First',
                  description: 'We put our customers at the heart of everything we do, ensuring their satisfaction is our top priority.'
                },
                {
                  title: 'Integrity',
                  description: 'We conduct our business with honesty, transparency, and ethical practices.'
                },
                {
                  title: 'Innovation',
                  description: 'We continuously improve our platform and services to better serve our customers.'
                },
                {
                  title: 'Community',
                  description: 'We believe in giving back and supporting the communities we serve.'
                },
                {
                  title: 'Quality',
                  description: 'We source and deliver only the best products from trusted suppliers.'
                },
                {
                  title: 'Accessibility',
                  description: 'We make online shopping easy and accessible for everyone.'
                }
              ].map((value, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Team</h2>
            <p className="text-gray-600 mb-6">
              Behind ShopSawa is a dedicated team of professionals committed to making your shopping experience exceptional. 
              From our customer service representatives to our logistics experts, every team member plays a crucial role 
              in bringing our vision to life.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Bran Don', role: 'CEO & Founder' },
                { name: 'Jane Smith', role: 'Head of Operations' },
                { name: 'Michael Johnson', role: 'Customer Experience Lead' },
                { name: 'Sarah Williams', role: 'Marketing Director' },
                { name: 'David Kimani', role: 'Technology Lead' },
                { name: 'Grace Mwangi', role: 'Logistics Manager' }
              ].map((member, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-center text-gray-900">{member.name}</h3>
                  <p className="text-gray-600 text-center">{member.role}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Join Our Team</h2>
            <p className="text-gray-600 mb-6">
              Interested in joining the ShopSawa family? We're always looking for talented and passionate individuals 
              to help us grow and improve our services.
            </p>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Current Openings</h3>
              <ul className="space-y-2 mb-6">
                {[
                  'Senior Frontend Developer',
                  'Customer Support Representative',
                  'Logistics Coordinator',
                  'Digital Marketing Specialist'
                ].map((job, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-700">{job}</span>
                  </li>
                ))}
              </ul>
              <p className="text-gray-600 mb-4">
                Don't see a position that matches your skills? We'd still love to hear from you! 
                Send us your CV at <a href="mailto:careers@shopsawa.com" className="text-blue-600 hover:underline">careers@shopsawa.com</a>.
              </p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                View All Openings
              </button>
            </div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
};

export default AboutPage;
