import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPanel from './components/AdminPanel';
import GoldenLine from './components/golden-line/GoldenLine';
import GoldenLineProjects from './components/golden-line/GoldenLineProjects';
import GoldenLineCatalog from './components/golden-line/GoldenLineCatalog';

import { Toaster } from './components/ui/sonner';
import './components/golden-line/Modal.css';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/golden-line" element={<GoldenLineProjects />} />
          <Route path="/golden-line/catalog" element={<GoldenLineCatalog />} />
          <Route path="/golden-line/editor/:projectId" element={<GoldenLine />} />
          <Route path="*" element={<Navigate to="/golden-line" replace />} />
        </Route>
        <Route element={<ProtectedRoute requiredRole="Admin" />}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
      </Routes>
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}

export default App;
