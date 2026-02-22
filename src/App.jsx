import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/routes/ProtectedRoute';
import RoleProtectedRoute from './components/routes/RoleProtectedRoute';
import DefaultRoute from './components/routes/DefaultRoute';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Services from './pages/Services';
import Employees from './pages/Employees';
import Transactions from './pages/Transactions';
import Queue from './pages/Queue';
import Reports from './pages/Reports';

// v1.2.1 - Refined Riwayat System Fixes
function App() {
    return (
        <AuthProvider>
            <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<DefaultRoute />} />

                        {/* Owner, Kasir, & Mekanik Routes */}
                        <Route path="dashboard" element={
                            <RoleProtectedRoute allowedRoles={['Owner', 'Kasir', 'Mekanik']}>
                                <Dashboard />
                            </RoleProtectedRoute>
                        } />
                        <Route path="queue" element={
                            <RoleProtectedRoute allowedRoles={['Owner', 'Kasir', 'Mekanik']}>
                                <Queue />
                            </RoleProtectedRoute>
                        } />
                        <Route path="customers" element={
                            <RoleProtectedRoute allowedRoles={['Owner', 'Kasir']}>
                                <Customers />
                            </RoleProtectedRoute>
                        } />
                        <Route path="inventory" element={
                            <RoleProtectedRoute allowedRoles={['Owner', 'Kasir']}>
                                <Inventory />
                            </RoleProtectedRoute>
                        } />

                        {/* All Roles */}
                        <Route path="services" element={
                            <RoleProtectedRoute allowedRoles={['Owner', 'Kasir', 'Mekanik']}>
                                <Services />
                            </RoleProtectedRoute>
                        } />
                        <Route path="transactions" element={
                            <RoleProtectedRoute allowedRoles={['Owner', 'Kasir']}>
                                <Transactions />
                            </RoleProtectedRoute>
                        } />

                        {/* Owner Only Routes */}
                        <Route path="employees" element={
                            <RoleProtectedRoute allowedRoles={['Owner']}>
                                <Employees />
                            </RoleProtectedRoute>
                        } />
                        <Route path="reports" element={
                            <RoleProtectedRoute allowedRoles={['Owner']}>
                                <Reports />
                            </RoleProtectedRoute>
                        } />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
