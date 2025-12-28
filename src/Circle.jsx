import React, { useEffect, useRef, useState } from 'react';
import { db } from './firebase';
import { doc, updateDoc, increment, getDoc, setDoc, addDoc, collection, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Badge, Button, Card } from '@gratiaos/ui';
import { Icon, Heart, Leaf, Sparkles } from '@gratiaos/icons';
import './index.css';
import { franc } from 'franc';

const MAX_MESSAGE_CHARS = 500;
const MAX_TRANSLATE_CHARS = 800;
const SUBMIT_COOLDOWN_MS = 4000;
const REACTION_COOLDOWN_MS = 900;
const TRANSLATE_COOLDOWN_MS = 12000;

function FireIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 2C9 5 5 8 5 13a7 7 0 0 0 14 0c0-5-4-8-7-11z" />
      <path d="M12 9a4 4 0 0 0-4 4 4 4 0 0 0 8 0 4 4 0 0 0-4-4z" />
    </Icon>
  );
}

export default function Circle() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [embers, setEmbers] = useState([]);
  const [showSoulCloud, setShowSoulCloud] = useState(false);
  const [glowingId, setGlowingId] = useState(null);
  const lastSubmitAtRef = useRef(0);
  const lastReactionAtRef = useRef(new Map());
  const lastTranslateAtRef = useRef(new Map());
  const translateInFlightRef = useRef(new Set());
  const langCode =
    franc(message.trim(), {
      whitelist: ['ron', 'ita', 'spa', 'eng', 'fra', 'deu'],
    }) || 'und';
  const [translations, setTranslations] = useState({});

  // Submit message to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_MESSAGE_CHARS) {
      setError(`Keep it under ${MAX_MESSAGE_CHARS} characters.`);
      return;
    }
    const now = Date.now();
    if (now - lastSubmitAtRef.current < SUBMIT_COOLDOWN_MS) {
      setError('Take a breath. Try again in a moment.');
      return;
    }
    lastSubmitAtRef.current = now;
    setError('');

    if (trimmed !== '') {
      await addDoc(collection(db, 'embers'), {
        text: trimmed,
        createdAt: serverTimestamp(),
        lang: langCode,
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
    const key = `${emberId}:${type}`;
    const now = Date.now();
    const last = lastReactionAtRef.current.get(key) || 0;
    if (now - last < REACTION_COOLDOWN_MS) return;
    lastReactionAtRef.current.set(key, now);

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

  const handleSpeak = (text, ambient, lang = 'en') => {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;

      const speak = () => {
        const voices = synth.getVoices();
        const sacredVoice =
          voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(lang)) ||
          voices.find((v) => v.name === 'Google UK English Female') ||
          voices.find((v) => v.name === 'Shelley (English (United Kingdom))') ||
          voices.find((v) => v.name === 'Samantha') ||
          voices[0];

        const rate = 0.85;
        const pitch = text.length < 80 ? 1.2 : text.length > 200 ? 0.95 : 1;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = sacredVoice;
        utterance.rate = rate;
        utterance.pitch = pitch;

        setTimeout(() => {
          synth.cancel();
          setGlowingId(text);
          synth.speak(utterance);
        }, 1000);

        utterance.onend = () => {
          setTimeout(() => {
            if (ambient) {
              ambient.pause();
              ambient.currentTime = 0;
            }
            setGlowingId(null);
          }, 1000);
        };
      };

      if (synth.getVoices().length === 0) {
        synth.onvoiceschanged = speak;
      } else {
        speak();
      }
    }
  };

  const handleTranslate = async (emberId, text, sourceLang = 'auto', targetLang = 'en') => {
    if (translations[emberId]) return;
    if (!text || text.length > MAX_TRANSLATE_CHARS) return;
    if (translateInFlightRef.current.has(emberId)) return;
    const now = Date.now();
    const last = lastTranslateAtRef.current.get(emberId) || 0;
    if (now - last < TRANSLATE_COOLDOWN_MS) return;
    lastTranslateAtRef.current.set(emberId, now);
    translateInFlightRef.current.add(emberId);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (result.translation) {
        setTranslations((prev) => ({
          ...prev,
          [emberId]: result.translation,
        }));
      }
    } catch (err) {
      console.error('Translation failed', err);
    } finally {
      translateInFlightRef.current.delete(emberId);
    }
  };

  function SoulCloud() {
    return (
      <div className="fc-soulcloud">
        <svg width="100%" height="100%" viewBox="0 0 800 600" className="cloud-animation fc-soulcloud-svg">
          <defs>
            <radialGradient id="soulCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff8dc" stopOpacity="1" />
              <stop offset="100%" stopColor="#fcd34d" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sparkle" cx="50%" cy="50%" r="30%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="400" cy="300" r="150" fill="url(#soulCore)" className="fc-pulse" />
          {[...Array(20)].map((_, i) => (
            <circle key={i} cx={Math.random() * 800} cy={Math.random() * 600} r={Math.random() * 2 + 1} fill="url(#sparkle)" className="fc-ping" />
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div className="fc-page fc-circle">
      {!submitted ? (
        <form onSubmit={handleSubmit} className="fc-form">
          <h2 className="fc-heading">Enter the Circle</h2>
          <textarea
            value={message}
            onChange={(e) => {
              const next = e.target.value;
              setMessage(next);
              if (error && next.trim().length <= MAX_MESSAGE_CHARS) {
                setError('');
              }
            }}
            placeholder="What wants to be seen today?"
            maxLength={MAX_MESSAGE_CHARS}
            className="fc-textarea"></textarea>
          {error && <p className="fc-error">{error}</p>}
          <Button type="submit" tone="accent" variant="solid" className="fc-button-lg fc-button--block">
            Share in the Circle
          </Button>
        </form>
      ) : (
        <div className="fc-thanks">
          <Card variant="elev" padding="lg" className="fc-thanks-card">
            <h2 className="fc-thanks-title">Thank you for sharing ✨</h2>
            <p className="fc-muted">Your voice has joined the fire.</p>
            <Button tone="accent" variant="solid" onClick={resetForm}>
              Share another
            </Button>
          </Card>
          {showSoulCloud && <SoulCloud />}
        </div>
      )}

      {embers.length > 0 && (
        <div className="fc-embers">
          <ul className="fc-embers-list">
            {embers.map((ember) => (
              <Card key={ember.id} as="li" variant="outline" padding="md" className="fc-ember">
                <p className={`fc-ember-text ${glowingId === ember.text ? 'fc-ember-text--glow' : 'fc-ember-text--hover'}`}>{ember.text}</p>

                {translations[ember.id] && <p className="fc-ember-translation">{translations[ember.id]}</p>}

                {ember.createdAt?.seconds && <p className="fc-ember-time">{new Date(ember.createdAt.seconds * 1000).toLocaleString()}</p>}

                <div className="fc-ember-actions">
                  <div className="fc-ember-actions-main">
                    <Button
                      onClick={() => {
                        const ambient = new Audio('https://firecircle.space/staring-at-the-night-sky.mp3');
                        ambient.loop = true;
                        ambient.volume = 0.25;

                        ambient
                          .play()
                          .then(() => {
                            handleSpeak(ember.text, ambient, ember.lang || 'en');
                          })
                          .catch(() => {
                            console.warn('Ambient blocked');
                            handleSpeak(ember.text, null, ember.lang || 'en');
                          });
                      }}
                      variant="ghost"
                      tone="accent"
                      density="snug"
                      className="fc-action-btn">
                      🔊 Firewhisper
                    </Button>
                    <Button
                      onClick={() => handleTranslate(ember.id, ember.text, ember.lang || 'auto', 'en')}
                      variant="ghost"
                      tone="accent"
                      density="snug"
                      className="fc-action-btn">
                      ✨ Translate
                    </Button>
                  </div>

                  <div className="fc-ember-reactions fc-reaction-badge" role="group" aria-label="Reactions">
                    <Badge
                      as="button"
                      type="button"
                      variant="subtle"
                      tone="accent"
                      size="md"
                      className="fc-reaction-badge"
                      leading={<FireIcon size="sm" />}
                      data-active={(ember.reactions?.fire || 0) > 0}
                      aria-pressed={(ember.reactions?.fire || 0) > 0}
                      onClick={() => handleReact(ember.id, 'fire')}>
                      {ember.reactions?.fire || 0}
                    </Badge>
                    <Badge
                      as="button"
                      type="button"
                      variant="subtle"
                      tone="accent"
                      size="md"
                      className="fc-reaction-badge"
                      leading={<Heart size="sm" />}
                      data-active={(ember.reactions?.heart || 0) > 0}
                      aria-pressed={(ember.reactions?.heart || 0) > 0}
                      onClick={() => handleReact(ember.id, 'heart')}>
                      {ember.reactions?.heart || 0}
                    </Badge>
                    <Badge
                      as="button"
                      type="button"
                      variant="subtle"
                      tone="accent"
                      size="md"
                      className="fc-reaction-badge"
                      leading={<Leaf size="sm" />}
                      data-active={(ember.reactions?.leaf || 0) > 0}
                      aria-pressed={(ember.reactions?.leaf || 0) > 0}
                      onClick={() => handleReact(ember.id, 'leaf')}>
                      {ember.reactions?.leaf || 0}
                    </Badge>
                    <Badge
                      as="button"
                      type="button"
                      variant="subtle"
                      tone="accent"
                      size="md"
                      className="fc-reaction-badge"
                      leading={<Sparkles size="sm" />}
                      data-active={(ember.reactions?.star || 0) > 0}
                      aria-pressed={(ember.reactions?.star || 0) > 0}
                      onClick={() => handleReact(ember.id, 'star')}>
                      {ember.reactions?.star || 0}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
