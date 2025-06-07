
import React from 'react';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: 'home' | 'debate' | 'results' | 'leaderboard') => void;
}

export const Navigation = ({ currentView, onViewChange }: NavigationProps) => {
  return (
    <nav className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Debatrix AI
        </h1>
        <div className="flex space-x-4">
          <Button
            variant={currentView === 'home' ? 'default' : 'ghost'}
            onClick={() => onViewChange('home')}
            className="text-white"
          >
            Home
          </Button>
          <Button
            variant={currentView === 'leaderboard' ? 'default' : 'ghost'}
            onClick={() => onViewChange('leaderboard')}
            className="text-white"
          >
            Leaderboard
          </Button>
        </div>
      </div>
    </nav>
  );
};
