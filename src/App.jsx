import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from "./pages/HomePage";
import LogIn from './pages/LogIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';

const App = () => {
  return ( 
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}
 
export default App;