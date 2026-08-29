import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Layout } from './Components/Layout';
import { Dashboard } from './Pages/Dashboard';
import { TripsPage } from './Pages/TripsPage';
import { TripDetailsPage } from './Pages/TripDetailsPage';
import { ClientsPage } from './Pages/ClientsPage';
import { DriversPage } from './Pages/DriversPage';
import { HotelsPage } from './Pages/HotelsPage';
import { DocumentsPage } from './Pages/DocumentsPage';
import { LoginPage } from './Pages/LoginPage';
import { CreateTripPage } from './Pages/CreateTripPage';

import { Toaster } from 'sonner';

const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="trips" element={<TripsPage />} />
            <Route path="trips/new" element={<CreateTripPage />} />
            <Route path="trips/:id/edit" element={<CreateTripPage />} />
            <Route path="trips/:id" element={<TripDetailsPage />} />
            <Route path="hotels" element={<HotelsPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
