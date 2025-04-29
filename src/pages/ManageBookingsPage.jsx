import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const ManageBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [venues, setVenues] = useState([]);

  // Check authentication and seller role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check if user is a seller by fetching their profile from Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsSeller(userData.role === 'seller');
          } else {
            setIsSeller(false);
          }
        } catch (err) {
          console.error('Error checking seller status:', err);
          setIsSeller(false);
        }
      } else {
        setIsSeller(false);
      }
      
      setAuthInitialized(true);
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch bookings and venues once authentication is confirmed
  useEffect(() => {
    if (authInitialized) {
      if (user && isSeller) {
        fetchSellerVenues();
        fetchBookings();
      } else if (user && !isSeller) {
        // Handle authenticated but not seller case
        setIsLoading(false);
        setError('Only sellers can access this page');
      } else {
        // Handle not authenticated case
        setIsLoading(false);
        setError('Please log in to manage bookings');
      }
    }
  }, [authInitialized, user, isSeller]);

  const fetchSellerVenues = async () => {
    try {
      const venuesRef = collection(db, 'venues');
      const q = query(venuesRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const venuesList = [];
      querySnapshot.forEach((doc) => {
        venuesList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setVenues(venuesList);
    } catch (err) {
      console.error('Error fetching venues:', err);
    }
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Query bookings where the seller ID matches the current user's ID
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('sellerId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const bookingsList = [];
      querySnapshot.forEach((doc) => {
        bookingsList.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          bookingDate: new Date(doc.data().bookingDate)
        });
      });
      
      // Sort bookings by date (newest first)
      bookingsList.sort((a, b) => {
        // First sort by status (pending first)
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        // Then sort by booking date
        return a.bookingDate - b.bookingDate;
      });
      
      setBookings(bookingsList);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      // Update booking status in Firestore
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError('Failed to update booking status. Please try again.');
    }
  };

  const getFilteredBookings = () => {
    let filtered = [...bookings];
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === filterStatus);
    }
    
    // Filter by venue
    if (venueFilter !== 'all') {
      filtered = filtered.filter(booking => booking.venueId === venueFilter);
    }
    
    return filtered;
  };

  // Show not a seller message
  if (authInitialized && user && !isSeller) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-dominant mb-4">Seller Access Required</h2>
          <p className="text-gray-600 mb-6">This page is only accessible to sellers. If you are a buyer, please check your bookings page.</p>
          <button
            onClick={() => window.location.href = '/my-bookings'}
            className="bg-highlight hover:cursor-pointer text-white py-2 px-6 rounded-lg transition duration-300"
          >
            Go to My Bookings
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
          <p className="text-gray-600 mb-6">Please log in to manage booking requests.</p>
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

  const filteredBookings = getFilteredBookings();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dominant mb-8">Manage Booking Requests</h1>
      
      {error && error !== 'Please log in to manage bookings' && error !== 'Only sellers can access this page' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-highlight"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Venue</label>
            <select 
              value={venueFilter} 
              onChange={(e) => setVenueFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-highlight"
            >
              <option value="all">All Venues</option>
              {venues.map(venue => (
                <option key={venue.id} value={venue.id}>{venue.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-highlight"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-xl font-medium text-gray-600 mb-2">No booking requests found</h3>
          <p className="text-gray-500 mb-4">You haven't received any booking requests for your venues yet.</p>
          <button
            onClick={() => window.location.href = '/my-venues'}
            className="bg-highlight hover:bg-highlight/90 text-white py-2 px-4 rounded-lg transition duration-300"
          >
            View My Venues
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-xl font-medium text-gray-600 mb-2">No bookings match your filters</h3>
          <p className="text-gray-500 mb-4">Try changing your filter criteria to see more results.</p>
          <button
            onClick={() => {
              setFilterStatus('all');
              setVenueFilter('all');
            }}
            className="bg-highlight hover:bg-highlight/90 text-white py-2 px-4 rounded-lg transition duration-300"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBookings.map((booking) => {
            const venue = venues.find(v => v.id === booking.venueId);
            
            return (
              <div key={booking.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className={`p-4 text-white flex justify-between items-center
                  ${booking.status === 'pending' ? 'bg-yellow-500' : 
                   booking.status === 'approved' ? 'bg-green-600' : 'bg-red-600'}
                `}>
                  <div>
                    <h3 className="text-xl font-semibold">{venue?.name || booking.venueName}</h3>
                    <p className="text-sm text-white/80">Booking ID: {booking.id}</p>
                  </div>
                  <span className="px-3 py-1 bg-dominant rounded-full text-xs font-semibold
                    ${booking.status === 'pending' ? 'text-yellow' : 
                     booking.status === 'approved' ? 'text-green-600' : 'text-red-600'}
                  ">
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Booking Date</p>
                      <p className="font-medium">{booking.bookingDate.toLocaleDateString()}</p>
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <p className="text-sm text-gray-500">
                        Requested on {booking.createdAt.toLocaleDateString()} at {booking.createdAt.toLocaleTimeString()}
                      </p>
                      
                      {booking.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                            className="bg-red-600 hover:bg-red-700 hover:cursor-pointer text-white py-2 px-4 rounded-lg text-sm transition duration-300"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700 hover:cursor-pointer text-white py-2 px-4 rounded-lg text-sm transition duration-300"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageBookingsPage;