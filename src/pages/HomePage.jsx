import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <header className="bg-dominant text-white p-4">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Venue Verse</h1>
          <nav className="space-x-4">
            <Link to="/login" className="hover:text-accent">Login</Link>
            <Link to="/signup" className="hover:text-accent">Sign Up</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center bg-dominant/10 py-16 px-4 md:px-0">
        <h2 className="text-4xl font-semibold text-center mb-4 text-dominant">
          Welcome to Venue Verse
        </h2>
        <p className="text-lg text-center max-w-lg mb-8 text-gray-700">
          The perfect platform for renting and selling venues for marriage receptions, events, and more. 
          Whether you're looking for a place to host your special day or want to offer your venue for rent, 
          Venue Verse connects buyers and sellers seamlessly.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/login" className="bg-dominant text-white py-2 px-6 rounded-md hover:bg-dominant/80">
            Log In
          </Link>
          <Link to="/signup" className="bg-highlight text-white py-2 px-6 rounded-md hover:bg-highlight/80">
            Sign Up
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white px-4 md:px-0">
        <div className="max-w-screen-xl mx-auto text-center">
          <h3 className="text-3xl font-semibold mb-8 text-dominant">Why Choose Venue Verse?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-100 p-6 rounded-lg shadow-md">
              <h4 className="text-xl font-semibold mb-4 text-dominant">Easy Booking</h4>
              <p>Browse a variety of venues and find the perfect match for your event needs.</p>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg shadow-md">
              <h4 className="text-xl font-semibold mb-4 text-dominant">Rent or Sell Venues</h4>
              <p>Offer your venue for rent or find a place to rent, all in one place.</p>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg shadow-md">
              <h4 className="text-xl font-semibold mb-4 text-dominant">Secure and Reliable</h4>
              <p>We ensure all transactions are safe and transparent for both parties.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dominant text-white py-4">
        <div className="max-w-screen-xl mx-auto text-center">
          <p>&copy; 2025 Venue Verse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
