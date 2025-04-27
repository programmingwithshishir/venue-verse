import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const LogIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
        if (err.code === "auth/user-disabled") {
          setError("This account has been disabled. Please contact support!!!")
        } else if (err.code === "auth/invalid-credential") {
          setError("Incorrect email or password. Please try again!!!")
        } else if (err.code === "auth/network-request-failed") {
          setError("Check your internet connection and try again!!!")
        } else {
          setError("Unhandled error: " + err.code)
        }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dominant px-4">
      <div className="bg-accent p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-dominant">Log In</h2>
        
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-dominant"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-dominant"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-dominant text-white py-2 px-4 rounded-md hover:cursor-pointer focus:outline-none"
            disabled={loading}
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-gray-700">
          Don't have an account?{' '}
          <Link to="/signup" className="text-highlight font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LogIn;
