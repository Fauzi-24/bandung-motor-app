import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/routes/ProtectedRoute';
import RoleProtectedRoute from './components/routes/RoleProtectedRoute';
import DefaultRoute from './components/routes/DefaultRoute';
import { Toaster } from 'react-hot-toast';

// Lazy loaded routes for performance splitting
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const Services = React.lazy(() => import('./pages/Services'));
const Employees = React.lazy(() => import('./pages/Employees'));
const Transactions = React.lazy(() => import('./pages/Transactions'));
const Queue = React.lazy(() => import('./pages/Queue'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Shop = React.lazy(() => import('./pages/Shop'));
const OnlineOrders = React.lazy(() => import('./pages/OnlineOrders'));

// Centered loading spinner for Suspense fallback
const LoadingFallback = () => (
    <div className="min-h-screen bg-[#050510] flex justify-center items-center">
        <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-[#00f0ff] animate-spin"></div>
    </div>
);

// v1.2.1 - Refined Riwayat System Fixes
function App() {
    return (
        <AuthProvider>
            <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />
            <BrowserRouter>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/shop" element={<Shop />} />

                        <Route path="/" element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<DefaultRoute />} />

                            {/* Owner, Kasir, Mekanik, & Admin Routes */}
                            <Route path="dashboard" element={
                                <RoleProtectedRoute allowedRoles={['Owner', 'Kasir', 'Mekanik', 'Admin']}>
                                    <Dashboard />
                                </RoleProtectedRoute>
                            } />
                            <Route path="queue" element={
                                <RoleProtectedRoute allowedRoles={['Owner', 'Kasir', 'Mekanik', 'Admin']}>
                                    <Queue />
                                </RoleProtectedRoute>
                            } />
                            <Route path="customers" element={
                                <RoleProtectedRoute allowedRoles={['Owner', 'Kasir', 'Admin']}>
                                    <Customers />
                                </RoleProtectedRoute>
                            } />
                            <Route path="inventory" element={
                                <RoleProtectedRoute allowedRoles={['Owner', 'Kasir', 'Admin']}>
                                    <Inventory />
                                </RoleProtectedRoute>
                            } />

                            {/* All Roles */}
                            <Route path="services" element={
                                <RoleProtectedRoute allowedRoles={['Owner', 'Kasir', 'Mekanik', 'Admin']}>
                                    <Services />
                                </RoleProtectedRoute>
                            } />
                            <Route path="transactions" element={
                                <RoleProtectedRoute allowedRoles={['Owner', 'Kasir', 'Admin']}>
                                    <Transactions />
                                </RoleProtectedRoute>
                            } />
                            <Route path="online-orders" element={
                                <RoleProtectedRoute allowedRoles={['Owner', 'Kasir', 'Admin']}>
                                    <OnlineOrders />
                                </RoleProtectedRoute>
                            } />

                            {/* Owner Only Routes */}
                            <Route path="employees" element={
                                <RoleProtectedRoute allowedRoles={['Owner', 'Admin']}>
                                    <Employees />
                                </RoleProtectedRoute>
                            } />
                            <Route path="reports" element={
                                <RoleProtectedRoute allowedRoles={['Owner', 'Admin']}>
                                    <Reports />
                                </RoleProtectedRoute>
                            } />
                        </Route>
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
