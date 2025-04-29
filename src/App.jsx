import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from "./pages/HomePage";
import LogIn from './pages/LogIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import MyVenue from './pages/MyVenue';
import BrowseVenuesPage from './pages/BrowseVenuesPage';
import MyBookingsPage from './pages/MyBookingsPage';
import ManageBookingsPage from './pages/ManageBookingsPage';

const App = () => {
  return ( 
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
        {/* Seller's Routes */}
        <Route path="/my-venues" element={<MyVenue />} />
        <Route path="/order-requests" element={<ManageBookingsPage />} />
        {/* Buyer's Routes */}
        <Route path="/venues" element={<BrowseVenuesPage />} />
        <Route path="/orders" element={<MyBookingsPage />} />
      </Routes>
    </Router>
  );
}
 
export default App;