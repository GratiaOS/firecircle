import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, updateDoc, increment, getDoc, setDoc, addDoc, collection, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import './index.css';

export default function Circle() {
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [embers, setEmbers] = useState([]);
  const [showSoulCloud, setShowSoulCloud] = useState(false);
  const [glowingId, setGlowingId] = useState(null);

  // Submit message to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() !== '') {
      await addDoc(collection(db, 'embers'), {
        text: message.trim(),
        createdAt: serverTimestamp(),
        reactions: {
          fire: 0,
          heart: 0,
          leaf: 0,
          star: 0,
        },
      });
      setSubmitted(true);
      setShowSoulCloud(true);
      setTimeout(() => setShowSoulCloud(false), 10000); // hide after 10s
      setMessage('');
    }
  };

  // Real-time sync with Firestore
  useEffect(() => {
    const q = query(collection(db, 'embers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emberData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          reactions: {
            fire: data.reactions?.fire || 0,
            heart: data.reactions?.heart || 0,
            leaf: data.reactions?.leaf || 0,
            star: data.reactions?.star || 0,
          },
        };
      });
      setEmbers(emberData);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setSubmitted(false);
  };

  const handleReact = async (emberId, type) => {
    const emberRef = doc(db, 'embers', emberId);
    const emberSnap = await getDoc(emberRef);

    if (emberSnap.exists()) {
      const data = emberSnap.data();
      const currentReactions = data.reactions || {
        fire: 0,
        heart: 0,
        leaf: 0,
        star: 0,
      };

      // First make sure the field exists for Firestore to increment
      if (!data.reactions || currentReactions[type] === undefined) {
        await setDoc(
          emberRef,
          {
            reactions: {
              ...currentReactions,
              [type]: (currentReactions[type] || 0) + 1,
            },
          },
          { merge: true }
        );
      } else {
        // Safe to increment
        await updateDoc(emberRef, {
          [`reactions.${type}`]: increment(1),
        });
      }
    } else {
      console.error('No such ember exists!');
    }
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;

      const speak = () => {
        const voices = synth.getVoices();

        const sacredVoice =
          voices.find((v) => v.name.toLowerCase().includes('google uk english female')) ||
          voices.find((v) => v.name.toLowerCase().includes('english') && v.name.toLowerCase().includes('female')) ||
          voices.find((v) => v.lang === 'en-GB') ||
          voices.find((v) => v.lang === 'en-US') ||
          voices[0];

        const length = text.length;
        const rate = 0.85;
        const pitch = length < 80 ? 1.2 : length > 200 ? 0.95 : 1;

        const ambient = new Audio('https://raw.githubusercontent.com/razvantirboaca/firecircle/main/public/staring-at-the-night-sky.mp3');
        ambient.loop = true;
        ambient.volume = 0.25;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = sacredVoice;
        utterance.rate = rate;
        utterance.pitch = pitch;

        ambient.play().catch(() => console.warn('Ambient sound blocked'));

        setTimeout(() => {
          synth.cancel();
          setGlowingId(text);
          synth.speak(utterance);
        }, 1000);

        utterance.onend = () => {
          setTimeout(() => {
            ambient.pause();
            ambient.currentTime = 0;
            setGlowingId(null);
          }, 1000);
        };
      };

      // Force voice population if empty
      if (synth.getVoices().length === 0) {
        synth.onvoiceschanged = speak;
      } else {
        speak();
      }
    } else {
      alert('Firewhispers are not supported in this browser.');
    }
  };

  function SoulCloud() {
    return (
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <svg width="100%" height="100%" viewBox="0 0 800 600" className="cloud-animation">
          <defs>
            <radialGradient id="cloudGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#fcd34d" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="400" cy="300" r="150" fill="url(#cloudGradient)" className="transition-all duration-1000 ease-out" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 via-orange-50 to-white flex flex-col items-center justify-center p-8 space-y-10">
      {!submitted ? (
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-amber-700 mb-4 text-center">Enter the Circle</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What wants to be seen today?"
            className="w-full h-40 p-4 rounded-md border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
          <button type="submit" className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-md shadow">
            Share in the Circle
          </button>
        </form>
      ) : (
        <div>
          <div className="text-center space-y-4">
            <h2 className="text-2xl text-amber-700 font-semibold">Thank you for sharing ✨</h2>
            <p className="text-amber-600">Your voice has joined the fire.</p>
            <button onClick={resetForm} className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md shadow">
              Share another
            </button>
          </div>
          {showSoulCloud && <SoulCloud />}
        </div>
      )}

      {embers.length > 0 && (
        <div className="w-full max-w-2xl mt-10">
          <h3 className="text-xl font-semibold text-amber-700 mb-4 text-center">Shared Embers</h3>
          <ul className="space-y-3">
            {embers.map((ember) => (
              <li key={ember.id} className="bg-amber-50 text-amber-800 p-4 rounded shadow-sm border border-amber-200">
                <p className={glowingId === ember.text ? 'glow' : ''}>{ember.text}</p>

                {ember.createdAt?.seconds && (
                  <p className="text-xs text-amber-500 mt-2">{new Date(ember.createdAt.seconds * 1000).toLocaleString()}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <button onClick={() => handleSpeak(ember.text)} className="text-sm text-amber-700 hover:underline">
                    🔊 Firewhisper
                  </button>

                  <div className="flex gap-3">
                    <button onClick={() => handleReact(ember.id, 'fire')}>🔥 {ember.reactions?.fire || 0}</button>
                    <button onClick={() => handleReact(ember.id, 'heart')}>❤️ {ember.reactions?.heart || 0}</button>
                    <button onClick={() => handleReact(ember.id, 'leaf')}>🌿 {ember.reactions?.leaf || 0}</button>
                    <button onClick={() => handleReact(ember.id, 'star')}>✨ {ember.reactions?.star || 0}</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
