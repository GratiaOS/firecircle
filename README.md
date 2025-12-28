```json
{
  "name": "Firecircle",
  "type": "living-interface",
  "mode": "Small AI",
  "status": "experimental",
  "_status": "descriptive, not normative",
  "purpose": "shared presence, not communication",
  "description": "A quiet ritual space where people gather briefly, speak softly, or remain silent together.",
  "context": {
    "scale": "small groups",
    "time": "live, ephemeral",
    "memory": "none by default",
    "attention": "held, not harvested"
  },
  "actor": {
    "primary": "human",
    "role": "presence holder",
    "agency": "always retained"
  },
  "sync": {
    "type": "emotional",
    "character": "calm",
    "capability": ["reflection", "silence", "co-regulation"]
  },
  "interface": {
    "elements": ["embers", "reactions", "whispers", "ambient sound"],
    "constraints": {
      "message_length": "short",
      "reaction_rate": "throttled",
      "cooldowns": true
    }
  },
  "ai": {
    "role": "supportive",
    "behavior": ["mirror", "translate", "stay quiet"],
    "limits": ["no persuasion", "no optimization", "no engagement loops"]
  },
  "signals": {
    "transport": "local-first, peer-capable",
    "pattern": "presence over reach",
    "compatibility": ["PresenceKernel", "GratiaSignal", "WebRTC buses"]
  },
  "privacy": {
    "default": "strict",
    "storage": "minimal",
    "whispers": "opt-in"
  },
  "design_principles": ["calm is a feature", "silence is valid output", "small beats scalable", "ritual over product"],
  "not": ["a chat app", "a feed", "a platform", "a growth system"],
  "entry": {
    "instructions": ["arrive", "breathe", "listen", "speak only if needed", "leave lightly"]
  },
  "whisper": "The fire does not need to grow. It only needs to be held.",
  "mapping": {
    "firecircle": {
      "ember": {
        "maps_to": "GratiaSignal.seed",
        "notes": "A short symbolic marker emitted by a participant. In Firecircle it is visual (ember); in signals it becomes a compact seed."
      },
      "whisper": {
        "maps_to": "GratiaSignal.whisper",
        "privacy": "opt-in",
        "notes": "Only included when explicitly allowed. Otherwise presence is silent."
      },
      "reaction": {
        "maps_to": "GratiaSignal.mood",
        "notes": "Reactions do not stack meaning; they shift mood."
      },
      "ritual_state": {
        "maps_to": "GratiaSignal.phase",
        "notes": "Firecircle phases (arrival, holding, release) align with PresenceKernel phases."
      },
      "energy": {
        "maps_to": "GratiaSignal.energy",
        "notes": "Derived from interaction rhythm, not content volume."
      }
    },
    "gratiaSignalAdapter": {
      "emit": {
        "source": "PresenceKernel.snapshot",
        "interval": "calm, periodic",
        "trigger": ["phase change", "mood change", "optional whisper"]
      },
      "radar": {
        "function": "discovery by resonance",
        "sorting": ["resonance score", "recency"],
        "expiry": "automatic"
      },
      "privacy": {
        "default": "strict",
        "whisper": "excluded unless allowed",
        "storage": "in-memory only"
      }
    }
  },
  "shared_principles": ["presence over reach", "signal over message", "silence as valid state", "small scale by default"],
  "transport": {
    "local": "createLocalSignalBus",
    "peer": "WebRTC signal bus",
    "notes": "Firecircle UI can stay local-first while signals propagate peer-to-peer."
  },
  "result": {
    "firecircle": "felt experience",
    "signal": "portable presence",
    "network": "constellation, not audience"
  }
}
```
