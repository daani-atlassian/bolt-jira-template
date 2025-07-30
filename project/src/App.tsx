import React from 'react';
import { useState, useEffect } from 'react';
import PasswordPage from './components/PasswordPage';
import TopNavigation from './components/Navigation/TopNavigation';
import ProjectHeader from './components/Navigation/ProjectHeader';
import ListView from './components/ListView/ListView';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem('prototype-authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleAuthenticate = () => {
    setIsAuthenticated(true);
  };

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f8f9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0052cc] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6b778c] text-sm">Loading prototype...</p>
        </div>
      </div>
    );
  }

  // Show password page if not authenticated
  if (!isAuthenticated) {
    return <PasswordPage onAuthenticate={handleAuthenticate} />;
  }

  // Show main application
  return (
    <div className="min-h-screen bg-[#f7f8f9]">
      {/* Top Navigation */}
      <TopNavigation />
      
      {/* Main Content - No sidebar */}
      <div className="flex flex-col">
        {/* Project Header */}
        <ProjectHeader />
        
        {/* List View */}
        <div className="flex-1 p-6">
          <ListView />
        </div>
      </div>
    </div>
  );
}

export default App;