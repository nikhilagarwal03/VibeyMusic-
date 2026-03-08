import React from 'react';
import { Home, Search, Library, Settings2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const routeToView = (path) => {
  if (path.startsWith('/search')) return 'search';
  if (path.startsWith('/library')) return 'library';
  if (path.startsWith('/settings')) return 'settings';
  return 'home';
};

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = routeToView(location.pathname);

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full h-[65px] bg-black/35 backdrop-blur-xl border-t border-white/5 flex justify-around items-center px-1 z-50">
      <button
        onClick={() => navigate('/home')}
        className={`flex flex-col items-center gap-1 motion-base ${activeView === 'home' ? 'text-blue-300' : 'text-gray-500 hover:text-gray-300'}`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] uppercase tracking-wide leading-none">Home</span>
      </button>

      <button
        onClick={() => navigate('/search')}
        className={`flex flex-col items-center gap-1 motion-base ${activeView === 'search' ? 'text-blue-300' : 'text-gray-500 hover:text-gray-300'}`}
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] uppercase tracking-wide leading-none">Search</span>
      </button>

      <button
        onClick={() => navigate('/library')}
        className={`flex flex-col items-center gap-1 motion-base ${activeView === 'library' ? 'text-blue-300' : 'text-gray-500 hover:text-gray-300'}`}
      >
        <Library className="w-5 h-5" />
        <span className="text-[10px] uppercase tracking-wide leading-none">Library</span>
      </button>

      <button
        onClick={() => navigate('/settings')}
        className={`flex flex-col items-center gap-1 motion-base ${activeView === 'settings' ? 'text-blue-300' : 'text-gray-500 hover:text-gray-300'}`}
      >
        <Settings2 className="w-5 h-5" />
        <span className="text-[10px] uppercase tracking-wide leading-none">Settings</span>
      </button>
    </div>
  );
};

export default BottomNav;
