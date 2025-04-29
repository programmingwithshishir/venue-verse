import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const BrowseVenuesPage = () => {
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isBuyer, setIsBuyer] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  
  // Filter states
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedAmenities, setSelectedAmenities] = useState({
    ac: false,
    soundSystem: false,
    foodCourt: false
  });
  const [selectedDay, setSelectedDay] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  
  // Booking form state
  const [bookingPurpose, setBookingPurpose] = useState('');
  const [bookingAttendees, setBookingAttendees] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Authentication check
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

  // Fetch venues when authentication is established
  useEffect(() => {
    if (authInitialized) {
      if (user && isBuyer) {
        fetchAllVenues();
      } else if (user && !isBuyer) {
        // User is logged in but not a buyer (probably a seller)
        setIsLoading(false);
        setError('This page is for booking venues. Sellers can manage their venues in the seller dashboard.');
      } else {
        // Not authenticated
        setIsLoading(false);
        setError('Please log in to browse and book venues');
      }
    }
  }, [authInitialized, user, isBuyer]);

  // Apply filters when filter values change
  useEffect(() => {
    if (venues.length > 0) {
      applyFilters();
    }
  }, [venues, priceRange, selectedAmenities, selectedDay]);

  const fetchAllVenues = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const venuesRef = collection(db, 'venues');
      const querySnapshot = await getDocs(venuesRef);
      
      const venuesList = [];
      querySnapshot.forEach((doc) => {
        venuesList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setVenues(venuesList);
      setFilteredVenues(venuesList);
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError('Failed to load venues. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...venues];
    
    // Filter by price range
    if (priceRange.min) {
      filtered = filtered.filter(venue => venue.price >= Number(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(venue => venue.price <= Number(priceRange.max));
    }
    
    // Filter by amenities
    if (selectedAmenities.ac) {
      filtered = filtered.filter(venue => venue.amenities.ac);
    }
    if (selectedAmenities.soundSystem) {
      filtered = filtered.filter(venue => venue.amenities.soundSystem);
    }
    if (selectedAmenities.foodCourt) {
      filtered = filtered.filter(venue => venue.amenities.foodCourt);
    }
    
    // Filter by day
    if (selectedDay) {
      filtered = filtered.filter(venue => venue.openDays.includes(selectedDay.toLowerCase()));
    }
    
    setFilteredVenues(filtered);
  };

  const handleBookClick = (venue) => {
    setSelectedVenue(venue);
    setShowBookingModal(true);
  };

  const handleClearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSelectedAmenities({
      ac: false,
      soundSystem: false,
      foodCourt: false
    });
    setSelectedDay('');
    setFilteredVenues(venues);
  };

  const validateBookingForm = () => {
    const errors = {};
    
    if (!bookingDate) {
      errors.bookingDate = 'Booking date is required';
    }
    
    if (!bookingPurpose.trim()) {
      errors.bookingPurpose = 'Purpose of booking is required';
    }
    
    if (!bookingAttendees.trim()) {
      errors.bookingAttendees = 'Number of attendees is required';
    } else if (isNaN(bookingAttendees) || Number(bookingAttendees) <= 0) {
      errors.bookingAttendees = 'Please enter a valid number of attendees';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateBookingForm()) {
      return;
    }
    
    try {
      // Prepare booking data
      const bookingData = {
        venueId: selectedVenue.id,
        venueName: selectedVenue.name,
        sellerId: selectedVenue.userId,
        buyerId: user.uid,
        bookingDate: bookingDate,
        purpose: bookingPurpose,
        attendees: Number(bookingAttendees),
        notes: bookingNotes,
        status: 'pending', // Initial status is pending until seller approves
        price: selectedVenue.price,
        createdAt: new Date()
      };
      
      // Add to bookings collection
      await addDoc(collection(db, 'bookings'), bookingData);
      
      // Reset form and close modal
      setBookingDate('');
      setBookingPurpose('');
      setBookingAttendees('');
      setBookingNotes('');
      setFormErrors({});
      setShowBookingModal(false);
      
      alert('Booking request submitted successfully! The venue owner will review your request.');
    } catch (err) {
      console.error('Error submitting booking request:', err);
      setError('Failed to submit booking request. Please try again.');
    }
  };

  // Show not a buyer message
  if (authInitialized && user && !isBuyer) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-dominant mb-4">Buyer Access Required</h2>
          <p className="text-gray-600 mb-6">This page is for booking venues. As a seller, you can manage your venues in the seller dashboard.</p>
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
          <p className="text-gray-600 mb-6">Please log in to browse and book venues.</p>
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
      <h1 className="text-3xl font-bold text-dominant mb-8">Browse Venues</h1>
      
      {error && error !== 'Please log in to browse and book venues' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedVenue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-90vh overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-dominant">Book {selectedVenue.name}</h3>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">Price:</p>
                <p className="font-bold text-highlight">₹{selectedVenue.price}/day</p>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">Location:</p>
                <p className="text-gray-800">{selectedVenue.location}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Available days:</p>
                <div className="flex flex-wrap justify-end gap-1">
                  {selectedVenue.openDays.map((day) => (
                    <span key={day} className="bg-accent/20 text-accent text-xs px-2 py-1 rounded-full">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <form onSubmit={handleBookingSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dominant mb-1">
                    Booking Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-highlight"
                  />
                  {formErrors.bookingDate && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.bookingDate}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dominant mb-1">
                    Purpose of Booking
                  </label>
                  <input
                    type="text"
                    value={bookingPurpose}
                    onChange={(e) => setBookingPurpose(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-highlight"
                    placeholder="e.g. Conference, Wedding, Corporate Event"
                  />
                  {formErrors.bookingPurpose && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.bookingPurpose}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dominant mb-1">
                    Number of Attendees
                  </label>
                  <input
                    type="text"
                    value={bookingAttendees}
                    onChange={(e) => setBookingAttendees(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-highlight"
                    placeholder="e.g. 50"
                  />
                  {formErrors.bookingAttendees && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.bookingAttendees}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dominant mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-highlight"
                    rows="3"
                    placeholder="Any specific requirements or questions..."
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition duration-300 hover:cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-highlight hover:cursor-pointer text-white py-2 px-4 rounded-lg transition duration-300"
                >
                  Submit Booking Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-4 sticky top-4">
            <h2 className="text-xl font-semibold text-dominant mb-4">Filters</h2>
            
            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-dominant mb-2">Price Range (₹)</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600">Min</label>
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-highlight"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Max</label>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-highlight"
                    placeholder="50000"
                  />
                </div>
              </div>
            </div>
            
            {/* Day Filter */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-dominant mb-2">Day Required</h3>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-highlight"
              >
                <option value="">Any Day</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
            
            {/* Amenities Filter */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-dominant mb-2">Amenities</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-ac"
                    checked={selectedAmenities.ac}
                    onChange={() => setSelectedAmenities({...selectedAmenities, ac: !selectedAmenities.ac})}
                    className="h-4 w-4 text-highlight rounded"
                  />
                  <label htmlFor="filter-ac" className="ml-2 text-sm text-gray-700">
                    Air Conditioning
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-sound"
                    checked={selectedAmenities.soundSystem}
                    onChange={() => setSelectedAmenities({...selectedAmenities, soundSystem: !selectedAmenities.soundSystem})}
                    className="h-4 w-4 text-highlight rounded"
                  />
                  <label htmlFor="filter-sound" className="ml-2 text-sm text-gray-700">
                    Sound System
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="filter-food"
                    checked={selectedAmenities.foodCourt}
                    onChange={() => setSelectedAmenities({...selectedAmenities, foodCourt: !selectedAmenities.foodCourt})}
                    className="h-4 w-4 text-highlight rounded"
                  />
                  <label htmlFor="filter-food" className="ml-2 text-sm text-gray-700">
                    Food Court
                  </label>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleClearFilters}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition duration-300 hover:cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Venues List */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-highlight"></div>
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h3 className="text-xl font-medium text-gray-600 mb-2">No venues match your criteria</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters to see more results.</p>
              <button
                onClick={handleClearFilters}
                className="bg-highlight hover:bg-highlight/90 text-white py-2 px-4 rounded-lg transition duration-300"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVenues.map((venue) => (
                <div key={venue.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-dominant text-white p-4">
                    <h3 className="text-xl font-semibold">{venue.name}</h3>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Hours of Operation</p>
                      <p className="font-medium">
                        {venue.openTime} - {venue.closeTime}
                      </p>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Open Days</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {venue.openDays.map((day) => (
                          <span
                            key={day}
                            className="bg-accent/20 text-accent text-xs px-2 py-1 rounded-full"
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Amenities</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {venue.amenities.ac && (
                          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                            AC
                          </span>
                        )}
                        {venue.amenities.soundSystem && (
                          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                            Sound System
                          </span>
                        )}
                        {venue.amenities.foodCourt && (
                          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                            Food Court
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{venue.location}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Price</p>
                        <p className="text-lg font-bold text-highlight">₹{venue.price}/day</p>
                      </div>
                      <button
                        onClick={() => handleBookClick(venue)}
                        className="bg-highlight hover:cursor-pointer text-white py-2 px-4 rounded-lg transition duration-300"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseVenuesPage;