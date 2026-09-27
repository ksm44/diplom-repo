import React from "react";

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import HallPage from './pages/HallPage';
import TicketPage from './pages/TicketPage';
import PaymentPage from './pages/PaymentPage';
import LoginPage from './pages/LoginPage';
import PrivateRoute from "./components/PrivateRoute";
import NotFoundPage from './pages/NotFoundPage';

import AdminDashboardPage from './admin/pages/AdminDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* публичные */}
        <Route path="/login" element={<LoginPage />} />

        {/* только через авторизацию */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/hall/:id" element={<HallPage />} />
          <Route path="/ticket/:id" element={<TicketPage />} />
          <Route path="/payment/:id" element={<PaymentPage />} />

        </Route>

        {/* только для Администраторов */}
        <Route element={<PrivateRoute role="administrator" />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        {/* если пользователь/фронт указал неправильный путь */}
        <Route path="*" element={<NotFoundPage />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
