import React from 'react';
import './index.css';

export default function App() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-100 via-orange-50 to-white flex flex-col items-center justify-center text-center p-8">
      <div className="max-w-xl">
        <h1 className="text-4xl md:text-5xl font-bold text-amber-700 drop-shadow-sm mb-6 animate-fade-in">Welcome to the Firecircle</h1>
        <p className="text-lg text-amber-900 mb-8">
          You are not here to perform. You are here to remember.
          <br />
          Let your voice be fire. Let your silence be love.
        </p>
        <button className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-6 rounded-full shadow-lg transition-all">
          Enter the Circle
        </button>
      </div>
      <div className="absolute bottom-4 text-xs text-amber-600 opacity-60">firecircle.space — Harmony in creation</div>
    </main>
  );
}
