import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminShell } from './features/admin';
import { AudioEngine, MobilePlayer, PlayerBar } from './features/player/ui';
import { BottomNav, MainView, Sidebar } from './features/layout';

const MainShell = ({ view }) => {
  return (
    <div className="h-screen w-screen bg-background text-primary overflow-hidden flex flex-col">
      <div className="flex-1 flex overflow-hidden pb-[130px] md:pb-[90px]">
        <Sidebar />
        <MainView forcedView={view} />
      </div>

      <AudioEngine />
      <PlayerBar />
      <BottomNav />
      <MobilePlayer />
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<MainShell view="home" />} />
      <Route path="/search" element={<MainShell view="search" />} />
      <Route path="/library" element={<MainShell view="library" />} />
      <Route path="/settings" element={<MainShell view="settings" />} />
      <Route path="/admin/*" element={<AdminShell />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;