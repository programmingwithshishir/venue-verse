import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [role, setRole] = useState('buyer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); 

  const schema = z.object({
    name: z.string().min(1, "Name is required"),
    number: z.string().min(10, "Phone number should be at least 10 digits").max(15, "Phone number can't be longer than 15 digits"),
    role: z.enum(['buyer', 'seller'], "Role should be either 'buyer' or 'seller'"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password should be at least 6 characters"),
  });

  const handleSignup = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const parsedData = schema.parse({ name, number, role, email, password });
      const userCredential = await createUserWithEmailAndPassword(auth, parsedData.email, parsedData.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: parsedData.name,
        number: parsedData.number,
        role: parsedData.role,
        email: parsedData.email,
        createdAt: new Date(),
      });
      setLoading(false);

      navigate('/');
    } catch (err) {
      setLoading(false);
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError('An error occurred during signup');
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-dominant px-4 sm:px-6 lg:px-8">
      <div className="w-full my-10 max-w-md p-8 bg-accent shadow-xl rounded-lg">
        <h2 className="text-3xl font-semibold text-dominant mb-6 text-center">Sign Up</h2>
        
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-dominant">Name</label>
            <input
              type="text"
              className="w-full p-3 border border-dominant rounded-md focus:ring-2 focus:ring-highlight focus:outline-none text-dominant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-dominant">Phone Number</label>
            <input
              type="text"
              className="w-full p-3 border border-dominant rounded-md focus:ring-2 focus:ring-highlight focus:outline-none text-dominant"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-dominant">Role</label>
            <select
              className="w-full p-3 border border-dominant rounded-md focus:ring-2 focus:ring-highlight focus:outline-none text-dominant"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-dominant">Email</label>
            <input
              type="email"
              className="w-full p-3 border border-dominant rounded-md focus:ring-2 focus:ring-highlight focus:outline-none text-dominant"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-dominant">Password</label>
            <input
              type="password"
              className="w-full p-3 border border-dominant rounded-md focus:ring-2 focus:ring-highlight focus:outline-none text-dominant"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-dominant text-white py-3 rounded-md hover:cursor-pointer focus:outline-none"
            disabled={loading}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <a href="/login" className="text-highlight font-semibold">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
