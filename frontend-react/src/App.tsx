
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';

import { Home } from './pages/Home';
import { Staking } from './pages/Staking';
import { Marketplace } from './pages/Marketplace';
import { Governance } from './pages/Governance';
import { Actions } from './pages/Actions';
import { Companies } from './pages/Companies';
import { Analytics } from './pages/Analytics';
import { Leaderboard } from './pages/Leaderboard';
import { Badges } from './pages/Badges';
import { Profile } from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import { RoleGuard } from './components/RoleGuard';

function App() {
  return (
    <WalletProvider>
      <UserProvider>
        <NotificationProvider>
          <ThemeProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* App routes with layout */}
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/actions" element={<Actions />} />
                  <Route path="/companies" element={<Companies />} />
                  <Route path="/marketplace" element={
                    <RoleGuard allowedRoles={['COMPANY']}>
                      <Marketplace />
                    </RoleGuard>
                  } />
                  <Route path="/staking" element={
                    <RoleGuard allowedRoles={['COMPANY']}>
                      <Staking />
                    </RoleGuard>
                  } />
                  <Route path="/governance" element={
                    <RoleGuard allowedRoles={['COMPANY', 'AUDITOR']}>
                      <Governance />
                    </RoleGuard>
                  } />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/badges" element={
                    <RoleGuard allowedRoles={['COMPANY']}>
                      <Badges />
                    </RoleGuard>
                  } />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Routes>
            </Router>
          </ThemeProvider>
        </NotificationProvider>
      </UserProvider>
    </WalletProvider>
  );
}

export default App;
