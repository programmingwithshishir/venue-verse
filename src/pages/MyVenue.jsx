import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const MyVenuePage = () => {
  const [venues, setVenues] = useState([]);
  const [isAddingVenue, setIsAddingVenue] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  const [venueName, setVenueName] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [openAmPm, setOpenAmPm] = useState('am');
  const [closeTime, setCloseTime] = useState('');
  const [closeAmPm, setCloseAmPm] = useState('pm');
  const [openDays, setOpenDays] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  });
  const [hasAC, setHasAC] = useState(false);
  const [hasSoundSystem, setHasSoundSystem] = useState(false);
  const [hasFoodCourt, setHasFoodCourt] = useState(false);
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // Only fetch venues after auth is initialized and user is logged in
  useEffect(() => {
    if (authInitialized) {
      if (user) {
        fetchVenues();
      } else {
        // Handle not authenticated case
        setIsLoading(false);
        setError('Please log in to view your venues');
      }
    }
  }, [authInitialized, user]);

  const fetchVenues = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // We already know user exists at this point
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
      setError('Failed to load venues. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Venue name validation
    if (!venueName.trim()) {
      errors.venueName = 'Venue name is required';
    } else if (venueName.length < 3) {
      errors.venueName = 'Venue name must be at least 3 characters';
    }
    
    // Open time validation
    if (!openTime) {
      errors.openTime = 'Opening time is required';
    }
    
    // Close time validation
    if (!closeTime) {
      errors.closeTime = 'Closing time is required';
    }
    
    // Open days validation
    const anyDaySelected = Object.values(openDays).some(day => day);
    if (!anyDaySelected) {
      errors.openDays = 'At least one day must be selected';
    }
    
    // Location validation
    if (!location.trim()) {
      errors.location = 'Location is required';
    }
    
    // Price validation
    if (!price) {
      errors.price = 'Price is required';
    } else if (isNaN(price) || Number(price) <= 0) {
      errors.price = 'Price must be a valid positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddVenue = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const selectedDays = Object.entries(openDays)
        .filter(([_, isSelected]) => isSelected)
        .map(([day]) => day);
      
      const newVenue = {
        name: venueName,
        openTime: `${openTime} ${openAmPm}`,
        closeTime: `${closeTime} ${closeAmPm}`,
        openDays: selectedDays,
        amenities: {
          ac: hasAC,
          soundSystem: hasSoundSystem,
          foodCourt: hasFoodCourt
        },
        location,
        price: Number(price),
        userId: user.uid,
        createdAt: new Date()
      };
      
      await addDoc(collection(db, 'venues'), newVenue);
      
      // Reset form and fetch updated venues
      resetForm();
      setIsAddingVenue(false);
      fetchVenues();
    } catch (err) {
      console.error('Error adding venue:', err);
      setError('Failed to add venue. Please try again.');
    }
  };

  const handleDeleteClick = (venue) => {
    setVenueToDelete(venue);
    setShowDeleteConfirmation(true);
  };

  const handleCancelDelete = () => {
    setVenueToDelete(null);
    setShowDeleteConfirmation(false);
  };

  const handleConfirmDelete = async () => {
    if (!venueToDelete || !venueToDelete.id) return;
    
    try {
      await deleteDoc(doc(db, 'venues', venueToDelete.id));
      setVenues(venues.filter(venue => venue.id !== venueToDelete.id));
      setShowDeleteConfirmation(false);
      setVenueToDelete(null);
    } catch (err) {
      console.error('Error deleting venue:', err);
      setError('Failed to delete venue. Please try again later.');
    }
  };

  const resetForm = () => {
    setVenueName('');
    setOpenTime('');
    setOpenAmPm('am');
    setCloseTime('');
    setCloseAmPm('pm');
    setOpenDays({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    });
    setHasAC(false);
    setHasSoundSystem(false);
    setHasFoodCourt(false);
    setLocation('');
    setPrice('');
    setFormErrors({});
  };

  const handleDayToggle = (day) => {
    setOpenDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  // Show auth redirect UI if not logged in
  if (authInitialized && !user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-dominant mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view and manage your venues.</p>
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-dominant">My Venues</h1>
        {!isAddingVenue && (
          <button
            onClick={() => setIsAddingVenue(true)}
            className="bg-highlight hover:bg-highlight/90 text-white py-2 px-4 rounded-lg transition duration-300"
          >
            Add New Venue
          </button>
        )}
      </div>

      {error && error !== 'Please log in to view your venues' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-dominant mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete venue "{venueToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-highlight"></div>
        </div>
      ) : isAddingVenue ? (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-dominant mb-4">Add New Venue</h2>
          <form onSubmit={handleAddVenue}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Venue Name */}
              <div className="col-span-full">
                <label className="block text-sm font-medium text-dominant mb-1">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-highlight"
                />
                {formErrors.venueName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.venueName}</p>
                )}
              </div>

              {/* Operating Hours */}
              <div>
                <label className="block text-sm font-medium text-dominant mb-1">
                  Opening Time
                </label>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="e.g. 9:00"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-highlight"
                  />
                  <select
                    value={openAmPm}
                    onChange={(e) => setOpenAmPm(e.target.value)}
                    className="border border-gray-300 rounded-r-md px-3 py-2 bg-gray-50"
                  >
                    <option value="am">AM</option>
                    <option value="pm">PM</option>
                  </select>
                </div>
                {formErrors.openTime && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.openTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dominant mb-1">
                  Closing Time
                </label>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="e.g. 5:00"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-highlight"
                  />
                  <select
                    value={closeAmPm}
                    onChange={(e) => setCloseAmPm(e.target.value)}
                    className="border border-gray-300 rounded-r-md px-3 py-2 bg-gray-50"
                  >
                    <option value="am">AM</option>
                    <option value="pm">PM</option>
                  </select>
                </div>
                {formErrors.closeTime && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.closeTime}</p>
                )}
              </div>

              {/* Open Days */}
              <div className="col-span-full">
                <label className="block text-sm font-medium text-dominant mb-2">
                  Open Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(openDays).map(([day, isChecked]) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        isChecked
                          ? 'bg-accent text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </button>
                  ))}
                </div>
                {formErrors.openDays && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.openDays}</p>
                )}
              </div>

              {/* Amenities */}
              <div className="col-span-full">
                <label className="block text-sm font-medium text-dominant mb-2">
                  Amenities
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="ac"
                      checked={hasAC}
                      onChange={() => setHasAC(!hasAC)}
                      className="h-4 w-4 text-highlight"
                    />
                    <label htmlFor="ac" className="ml-2 text-sm text-gray-700">
                      Air Conditioning
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sound"
                      checked={hasSoundSystem}
                      onChange={() => setHasSoundSystem(!hasSoundSystem)}
                      className="h-4 w-4 text-highlight"
                    />
                    <label htmlFor="sound" className="ml-2 text-sm text-gray-700">
                      Sound System
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="food"
                      checked={hasFoodCourt}
                      onChange={() => setHasFoodCourt(!hasFoodCourt)}
                      className="h-4 w-4 text-highlight"
                    />
                    <label htmlFor="food" className="ml-2 text-sm text-gray-700">
                      Food Court
                    </label>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-dominant mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-highlight"
                  placeholder="e.g. 123 Main St, City"
                />
                {formErrors.location && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.location}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-dominant mb-1">
                  Price (per day)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-highlight"
                    placeholder="0.00"
                  />
                </div>
                {formErrors.price && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAddingVenue(false);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-highlight hover:bg-highlight/90 text-white py-2 px-4 rounded-lg transition duration-300"
              >
                Add Venue
              </button>
            </div>
          </form>
        </div>
      ) : venues.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <h3 className="text-xl font-medium text-gray-600 mb-2">No venues found</h3>
          <p className="text-gray-500 mb-4">You haven't added any venues yet.</p>
          <button
            onClick={() => setIsAddingVenue(true)}
            className="bg-highlight hover:bg-highlight/90 text-white py-2 px-4 rounded-lg transition duration-300"
          >
            Add Your First Venue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <div key={venue.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-dominant text-white p-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold">{venue.name}</h3>
                <button
                  onClick={() => handleDeleteClick(venue)}
                  className="text-white hover:text-red-200 transition-colors"
                  aria-label="Delete venue"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
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
                    <p className="text-lg font-bold text-highlight">${venue.price}/day</p>
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

export default MyVenuePage;