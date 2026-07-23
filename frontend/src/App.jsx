import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Customers from './pages/Customers';
import Policies from './pages/Policies';
import Premiums from './pages/Premiums';
import Claims from './pages/Claims';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/premiums" element={<Premiums />} />
              <Route path="/claims" element={<Claims />} />
              <Route path="/settings" element={<Settings />} />
              {/* Add other protected routes here later */}
            </Route>
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
