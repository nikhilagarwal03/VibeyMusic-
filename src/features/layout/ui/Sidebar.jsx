import React from 'react';
import { Home, Search, Library, Settings2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../../store/usePlayerStore';
import vibeyLogo from '../../../assets/img1.png';

const routeToView = (path) => {
  if (path.startsWith('/search')) return 'search';
  if (path.startsWith('/library')) return 'library';
  if (path.startsWith('/settings')) return 'settings';
  return 'home';
};

const viewToRoute = {
  home: '/home',
  search: '/search',
  library: '/library',
  settings: '/settings',
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = routeToView(location.pathname);
  const likedSongs = usePlayerStore((state) => state.likedSongs);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Your Library', icon: Library },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ];

  return (
    <div className="hidden md:flex w-[252px] h-full flex-col p-5 border-r border-white/5 bg-black/25 backdrop-blur-xl">
      <div className="mb-9">
        <div className="brand-lockup-row">
          <img src={vibeyLogo} alt="Vibey Music" className="brand-logo-image" />
          <div className="brand-wordmark-wrap">
            <h1 className="brand-wordmark-title">Vibey Music</h1>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-2 font-medium">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(viewToRoute[item.id])}
            className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl motion-base ${
              activeView === item.id
                ? 'control-surface text-blue-100'
                : 'btn-ghost hover:bg-white/[0.02]'
            }`}
            aria-current={activeView === item.id ? 'page' : undefined}
          >
            {React.createElement(item.icon, { className: 'w-[18px] h-[18px]' })}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-5 border-t border-white/5">
        <p className="type-caption text-gray-400 mb-3">Your Vibes</p>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/library')}
            className="w-full text-left type-body text-gray-300 hover:text-white motion-base flex items-center justify-between group panel-card px-3 py-2.5"
          >
            <span>Liked Songs</span>
            <span className="text-xs chip-soft px-2 py-0.5 rounded-md">{likedSongs.length}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
