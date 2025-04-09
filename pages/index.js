import React from 'react';
import RabbifyInterface from '../components/RabbifyInterface';
import { RabbifyPlayerProvider } from '../lib/rabbifyPlayer';

export default function Home() {
  return (
    <RabbifyPlayerProvider>
      <div className="w-full h-screen bg-black">
        <RabbifyInterface />
      </div>
    </RabbifyPlayerProvider>
  );
}