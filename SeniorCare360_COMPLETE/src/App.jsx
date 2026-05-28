import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import HomeScreen from './pages/HomeScreen';
import MedicationsScreen from './pages/MedicationsScreen';
import VitalsScreen from './pages/VitalsScreen';
import AppointmentsScreen from './pages/AppointmentsScreen';
import EmergencyScreen from './pages/EmergencyScreen';
import FamilyScreen from './pages/FamilyScreen';
import BenefitsScreen from './pages/BenefitsScreen';
import DeliveryScreen from './pages/DeliveryScreen';
import ProfileScreen from './pages/ProfileScreen';
import About from './pages/About';
import Contact from './pages/Contact';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<HomeScreen />} />
      <Route path="/medications" element={<MedicationsScreen />} />
      <Route path="/vitals" element={<VitalsScreen />} />
      <Route path="/appointments" element={<AppointmentsScreen />} />
      <Route path="/emergency" element={<EmergencyScreen />} />
      <Route path="/family" element={<FamilyScreen />} />
      <Route path="/benefits" element={<BenefitsScreen />} />
      <Route path="/delivery" element={<DeliveryScreen />} />
      <Route path="/profile" element={<ProfileScreen />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App