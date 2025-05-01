import React from 'react';
import { Users, Calendar, Phone, MapPin, Kanban as Kaaba } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpg';

function HomePage() {
  const navigate = useNavigate();
  return (
    
    <>
      <div>
      </div>
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Your Journey to Sacred Lands
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience the spiritual journey of Hajj and Umrah with our expert guidance and comprehensive packages
          </p>
          <button
          onClick={() => navigate('/admin-login')}
          className="bg-emerald-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition-colors">
            Admin Login
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Expert Guidance</h3>
              <p className="text-gray-600">Experienced guides to assist you throughout your spiritual journey</p>
            </div>
            <div className="text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Flexible Packages</h3>
              <p className="text-gray-600">Choose from various packages that suit your needs and schedule</p>
            </div>
            <div className="text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Premium Accommodation</h3>
              <p className="text-gray-600">Comfortable stays near the holy sites for your convenience</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to Start Your Journey?</h2>
          <div className="flex justify-center space-x-4">
            <button className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
              Book Now
            </button>
            <button className="border-2 border-emerald-600 text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600 hover:text-white transition-colors">
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-8">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <img 
              src={logo} 
              alt="Company Logo" 
              className="h-20 object-contain rounded-2xl"
            />

            {/* About Us */}
            <div>
              <h3 className="text-lg font-bold mb-2">About Us</h3>
              <p className="text-gray-300 text-sm max-w-xs">
                We provide expert guidance and comprehensive packages for your spiritual journey to Hajj and Umrah.
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-bold mb-2">Contact Us</h3>
              <div className="space-y-1">
                <p className="text-gray-300 text-sm">
                  <Phone className="inline-block h-4 w-4 mr-2" />
                  +91 9946666139
                </p>
                <p className="text-gray-300 text-sm">
                  <span className="inline-block">✉️</span> admin@d4dx.co
                </p>
              </div>
            </div>

            {/* Privacy Policy */}
            <div>
              <h3 className="text-lg font-bold mb-2">Legal</h3>
              <a 
                href="https://www.termsfeed.com/live/f6a02e03-eee0-410a-9363-f14f50493b17" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-300 text-sm hover:text-emerald-400"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default HomePage;