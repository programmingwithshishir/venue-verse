import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  const navigate = useNavigate();  // Initialize navigate function

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
          setUserDetails(userDoc.data());
        }
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-lg text-gray-700">You are not logged in. Please log in to view your profile.</p>
      </div>
    );
  }

  // Capitalize the first letter of the role
  const capitalizedRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-dominant text-white p-4">
        <div className="max-w-screen-xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Your Profile</h1>
        </div>
      </header>

      {/* Profile Section */}
      <section className="pt-16 px-4 md:px-0">
        <div className="max-w-screen-xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-semibold text-dominant mb-6">Profile Details</h2>
          {userDetails && (
            <div className="space-y-6">
              {/* Name and Role */}
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-highlight">Name:</h3>
                <p className="text-dominant">{userDetails.name}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-highlight">Role:</h3>
                <p className="text-dominant">{capitalizedRole}</p>
              </div>

              {/* Email and Phone Number */}
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-highlight">Email:</h3>
                <p className="text-dominant">{userDetails.email}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-highlight">Phone Number:</h3>
                <p className="text-dominant">{userDetails.number}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Go Back Button */}
      <div className="max-w-screen-xl mx-auto text-center py-4">
        <button
          onClick={() => navigate('/')}
          className="bg-dominant text-white hover:cursor-pointer px-6 py-3 rounded-lg font-semibold"
        >
          Go Back to Home
        </button>
      </div>
    </div>
  );
};

export default Profile;