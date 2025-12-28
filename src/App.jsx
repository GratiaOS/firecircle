import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@gratiaos/ui';
import './index.css';

export default function App() {
  const navigate = useNavigate();

  return (
    <main className="fc-page fc-landing">
      <div className="fc-hero animate-fadein-soul">
        <h1 className="fc-title">Welcome to the Firecircle</h1>
        <p className="fc-lede">
          You are not here to perform. You are here to remember.
          <br />
          Let your voice be fire. Let your silence be love.
        </p>
        <Button
          tone="accent"
          variant="solid"
          className="fc-button-lg"
          onClick={() => navigate('/circle')}
        >
          Enter the Circle
        </Button>
      </div>
      <div className="fc-footer">firecircle.space — Harmony in creation</div>
    </main>
  );
}
