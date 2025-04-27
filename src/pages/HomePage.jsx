import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Menu, X } from 'lucide-react'; // for hamburger and close icons

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false); // for mobile menu toggle
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <header className="bg-dominant text-white p-4">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Venue Verse</h1>

          {/* Hamburger Button (mobile only) */}
          <div className="md:hidden">
            <button onClick={toggleMenu}>
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav
            className={`${
              menuOpen ? 'block' : 'hidden'
            } absolute top-16 left-0 w-full bg-dominant text-center md:static md:flex md:items-center md:space-x-4 md:bg-transparent md:w-auto`}
          >
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6 p-4 md:p-0">
              {!user && (
                <>
                  <Link to="/login" className="hover:text-accent" onClick={() => setMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/signup" className="hover:text-accent" onClick={() => setMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
              {user && role === 'buyer' && (
                <>
                  <Link to="/profile" className="hover:text-accent" onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/venues" className="hover:text-accent" onClick={() => setMenuOpen(false)}>
                    Venues Available
                  </Link>
                  <Link to="/orders" className="hover:text-accent" onClick={() => setMenuOpen(false)}>
                    My Orders
                  </Link>
                </>
              )}
              {user && role === 'seller' && (
                <>
                  <Link to="/profile" className="hover:text-accent" onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/my-venues" className="hover:text-accent" onClick={() => setMenuOpen(false)}>
                    My Venues
                  </Link>
                  <Link to="/order-requests" className="hover:text-accent" onClick={() => setMenuOpen(false)}>
                    Order Requests
                  </Link>
                </>
              )}
              {user && (
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="bg-accent hover:bg-accent/80 text-dominant py-1 px-4 rounded-md"
                >
                  Logout
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      {/* (your existing hero section, features, footer stay the same...) */}
      
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
        {!user && (
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/login" className="bg-dominant text-white py-2 px-6 rounded-md hover:bg-dominant/80">
              Log In
            </Link>
            <Link to="/signup" className="bg-highlight text-white py-2 px-6 rounded-md hover:bg-highlight/80">
              Sign Up
            </Link>
          </div>
        )}
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