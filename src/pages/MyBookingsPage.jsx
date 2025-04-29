import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isBuyer, setIsBuyer] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  // Check authentication and buyer role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check if user is a buyer by fetching their profile from Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsBuyer(userData.role === 'buyer' || userData.role === 'user');
          } else {
            setIsBuyer(false);
          }
        } catch (err) {
          console.error('Error checking buyer status:', err);
          setIsBuyer(false);
        }
      } else {
        setIsBuyer(false);
      }
      
      setAuthInitialized(true);
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch bookings once authentication is confirmed
  useEffect(() => {
    if (authInitialized) {
      if (user && isBuyer) {
        fetchBookings();
      } else if (user && !isBuyer) {
        // Handle authenticated but not buyer case
        setIsLoading(false);
        setError('Only buyers can access this page');
      } else {
        // Handle not authenticated case
        setIsLoading(false);
        setError('Please log in to view your bookings');
      }
    }
  }, [authInitialized, user, isBuyer]);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Query bookings where the buyer ID matches the current user's ID
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('buyerId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const bookingsList = [];
      querySnapshot.forEach((doc) => {
        bookingsList.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });
      
      // Sort bookings by date (newest first)
      bookingsList.sort((a, b) => b.createdAt - a.createdAt);
      
      setBookings(bookingsList);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = (booking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel || !bookingToCancel.id) return;
    
    try {
      // Delete the booking
      await deleteDoc(doc(db, 'bookings', bookingToCancel.id));
      
      // Update the local state
      setBookings(bookings.filter(booking => booking.id !== bookingToCancel.id));
      
      setShowCancelModal(false);
      setBookingToCancel(null);
    } catch (err) {
      console.error('Error canceling booking:', err);
      setError('Failed to cancel booking. Please try again later.');
    }
  };

  // Show not a buyer message
  if (authInitialized && user && !isBuyer) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-dominant mb-4">Buyer Access Required</h2>
          <p className="text-gray-600 mb-6">This page is only accessible to buyers. If you are a seller, please check your venue management page.</p>
          <button
            onClick={() => window.location.href = '/my-venues'}
            className="bg-highlight hover:cursor-pointer text-white py-2 px-6 rounded-lg transition duration-300"
          >
            Go to My Venues
          </button>
        </div>
      </div>
    );
  }

  // Show auth redirect UI if not logged in
  if (authInitialized && !user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-dominant mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your bookings.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-highlight hover:bg-highlight/90 text-white py-2 px-6 rounded-lg transition duration-300"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dominant mb-8">My Bookings</h1>
      
      {error && error !== 'Please log in to view your bookings' && error !== 'Only buyers can access this page' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-dominant mb-4">Confirm Cancellation</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to cancel your booking request for "{bookingToCancel?.venueName}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setBookingToCancel(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition duration-300"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-300"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-highlight"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-2xl mx-auto">
          <h3 className="text-xl font-medium text-gray-600 mb-2">No bookings found</h3>
          <p className="text-gray-500 mb-4">You haven't made any venue booking requests yet.</p>
          <button
            onClick={() => window.location.href = '/venues'}
            className="bg-highlight hover:bg-highlight/90 text-white py-2 px-4 rounded-lg transition duration-300"
          >
            Browse Venues
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-dominant text-white p-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold">{booking.venueName}</h3>
                <span className={`
                  px-3 py-1 rounded-full text-xs font-semibold
                  ${booking.status === 'approved' ? 'bg-green-600' : 
                   booking.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-500'}
                `}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Booking Date</p>
                    <p className="font-medium">{new Date(booking.bookingDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-bold text-highlight">₹{booking.price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Purpose</p>
                    <p className="font-medium">{booking.purpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Attendees</p>
                    <p className="font-medium">{booking.attendees}</p>
                  </div>
                  {booking.notes && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Additional Notes</p>
                      <p className="font-medium">{booking.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Requested on {booking.createdAt.toLocaleDateString()} at {booking.createdAt.toLocaleTimeString()}
                    </p>
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancelClick(booking)}
                        className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-lg text-sm transition duration-300"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;