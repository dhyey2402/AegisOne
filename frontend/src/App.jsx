import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Lazy load pages for performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Customers = lazy(() => import('./pages/Customers'));
const Policies = lazy(() => import('./pages/Policies'));
const Premiums = lazy(() => import('./pages/Premiums'));
const Claims = lazy(() => import('./pages/Claims'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'));
const Documents = lazy(() => import('./pages/Documents'));
const Receipt = lazy(() => import('./pages/Receipt'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center text-muted-foreground">Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:id/profile" element={<CustomerProfile />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/premiums" element={<Premiums />} />
                <Route path="/claims" element={<Claims />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              <Route path="/receipt/:id" element={<Receipt />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
