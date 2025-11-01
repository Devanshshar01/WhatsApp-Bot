import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthContext } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import CommandsPage from './pages/CommandsPage.jsx';
import LogsPage from './pages/LogsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';

function PrivateRoute({ children }) {
  const { loading, isAuthenticated } = useAuthContext();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="commands" element={<CommandsPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
