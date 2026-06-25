import { useState, useEffect } from "react";
import type { Mood } from "../types";

// Import all gifs
import idleGif from "../assets/hami/idle.gif";
import thinkingGif from "../assets/hami/thinking.gif";
import workingGif from "../assets/hami/working.gif";
import happyGif from "../assets/hami/happy.gif";
import warningGif from "../assets/hami/warning.gif";
import feedGif from "../assets/hami/feed.gif";
import petGif from "../assets/hami/pet.gif";

interface Props {
  mood: Mood;
  bubbleText?: string;
  onPet: () => void;
  onFeed: () => void;
  happiness: number;
  hunger: number;
}

const GIF_MAP: Record<string, string> = {
  idle: idleGif,
  thinking: thinkingGif,
  working: workingGif,
  happy: happyGif,
  warning: warningGif,
  sleeping: idleGif,
};

export default function HamiAvatar({ mood, bubbleText, onPet, onFeed, happiness, hunger }: Props) {
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleKey, setBubbleKey] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const [petEffect, setPetEffect] = useState(false);
  const [actionAnimation, setActionAnimation] = useState<"feed" | "pet" | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);

  useEffect(() => {
    if (bubbleText) {
      setShowBubble(true);
      setBubbleKey(k => k + 1);
    } else {
      setShowBubble(false);
    }
  }, [bubbleText]);

  const handlePet = () => {
    onPet();
    setActionAnimation("pet");
    setPetEffect(true);
    setHearts(h => [...h, Date.now()]);
    
    // Create particle effects
    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 60 - 30,
      y: Math.random() * -80 - 20,
      emoji: ["❤️", "💕", "✨"][Math.floor(Math.random() * 3)],
    }));
    setParticles(newParticles);
    
    setTimeout(() => {
      setPetEffect(false);
      setHearts(h => h.slice(1));
      setParticles([]);
      setActionAnimation(null);
    }, 1200);
  };

  const handleFeed = () => {
    onFeed();
    setActionAnimation("feed");
    
    // Create corn particles
    const cornParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 80 - 40,
      y: Math.random() * -100 - 30,
      emoji: "🌽",
    }));
    setParticles(cornParticles);
    
    setTimeout(() => {
      setParticles([]);
      setActionAnimation(null);
    }, 1400);
  };

  const gif = actionAnimation === "feed" ? feedGif : actionAnimation === "pet" ? petGif : GIF_MAP[mood] || idleGif;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", paddingTop: "8px" }}>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "8px", width: "100%" }}>
        <StatBar label="❤️ Happy" value={happiness} color="#FF8C42" />
        <StatBar label="🌽 Full" value={hunger} color="#FFB380" />
      </div>

      {/* Bubble thought */}
      {showBubble && bubbleText && (
        <div key={bubbleKey} style={{
          position: "relative",
          maxWidth: "calc(100% - 16px)",
          width: "100%",
          marginBottom: "4px",
          animation: "bubblePop 0.25s ease-out forwards",
          zIndex: 2,
        }}>
          {/* Bubble container */}
          <div style={{
            background: "white",
            border: "2.5px solid #F0D9CC",
            borderRadius: "18px",
            padding: "12px 16px",
            fontSize: "13.5px",
            lineHeight: "1.55",
            color: "#3D2B1F",
            boxShadow: "0 4px 16px rgba(255,140,66,0.12)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {bubbleText}
          </div>
          {/* Triangle pointer down toward hamster */}
          <div style={{
            width: 0, height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "10px solid #F0D9CC",
            margin: "0 auto",
            position: "relative",
            top: "-1px",
          }} />
          <div style={{
            width: 0, height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "9px solid white",
            margin: "-19px auto 0",
          }} />
        </div>
      )}

      {/* Hamster gif with action animations */}
      <div style={{ position: "relative", display: "inline-block" }}>
        {/* Particle effects */}
        {particles.map(p => (
          <span key={p.id} style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            fontSize: "24px",
            pointerEvents: "none",
            zIndex: 5,
            animation: `particleFloat ${actionAnimation === "feed" ? "1.4s" : "1.2s"} cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            transform: `translate(calc(-50% + ${p.x}px), -50%)`,
          }}>
            {p.emoji}
          </span>
        ))}

        {/* Floating hearts on pet */}
        {hearts.map(id => (
          <span key={id} style={{
            position: "absolute",
            top: "-8px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "20px",
            animation: "heartPop 0.8s ease forwards",
            pointerEvents: "none",
            zIndex: 5,
          }}>🧡</span>
        ))}

        <img
          src={gif}
          alt={`Hami is ${mood}`}
          onClick={handlePet}
          style={{
            width: "clamp(160px, 30vw, 220px)",
            imageRendering: "pixelated",
            cursor: "pointer",
            filter: petEffect ? "brightness(1.25) saturate(1.4) drop-shadow(0 0 15px rgba(255,140,66,0.6))" : "drop-shadow(0 4px 12px rgba(255,140,66,0.2))",
            transition: "filter 0.2s ease",
            animation: 
              actionAnimation === "pet" ? "petBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" :
              actionAnimation === "feed" ? "feedNom 0.8s ease-in-out" :
              mood === "idle" ? "float 3s ease-in-out infinite" : "none",
          }}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "8px", marginTop: "10px", width: "100%" }}>
        <ActionButton 
          onClick={handlePet} 
          emoji="🤲" 
          label="Pet" 
          color="#FFB380"
          isActive={actionAnimation === "pet"}
        />
        <ActionButton 
          onClick={handleFeed} 
          emoji="🌽" 
          label="Feed" 
          color="#FF8C42"
          isActive={actionAnimation === "feed"}
        />
      </div>

      {/* Mood label */}
      <div style={{
        marginTop: "8px",
        fontSize: "12px",
        fontWeight: 700,
        color: "var(--text-soft)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontFamily: "Nunito, sans-serif",
      }}>
        {moodLabel(mood)}
      </div>
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-soft)", marginBottom: "3px", fontFamily: "Nunito" }}>{label}</div>
      <div style={{ height: "10px", background: "#F0D9CC", borderRadius: "999px", overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{
          height: "100%",
          width: `${value}%`,
          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          borderRadius: "999px",
          transition: "width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: `0 0 8px ${color}80`,
        }} />
      </div>
    </div>
  );
}

function ActionButton({ onClick, emoji, label, color, isActive }: { onClick: () => void; emoji: string; label: string; color: string; isActive?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: isActive ? color : color,
        color: "white",
        border: "none",
        borderRadius: "var(--r-full)",
        padding: isActive ? "8px 16px" : "6px 14px",
        fontSize: "13px",
        fontWeight: 700,
        fontFamily: "Nunito, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        flex: 1,
        boxShadow: isActive 
          ? `0 0 20px ${color}80, 0 4px 12px ${color}40` 
          : `0 2px 8px ${color}40`,
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: isActive ? "scale(1.08)" : "scale(1)",
        opacity: isActive ? 1 : 0.9,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.boxShadow = `0 4px 16px ${color}60`;
          e.currentTarget.style.transform = "scale(1.05)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.boxShadow = `0 2px 8px ${color}40`;
          e.currentTarget.style.transform = "scale(1)";
        }
      }}
    >
      <span style={{ animation: isActive ? "pulse 0.6s ease-in-out" : "none" }}>
        {emoji}
      </span>
      {label}
    </button>
  );
}

function moodLabel(mood: Mood): string {
  const labels: Record<Mood, string> = {
    idle: "😊 Relaxed",
    thinking: "🤔 Thinking",
    working: "💼 Working",
    happy: "🎉 Happy",
    warning: "⚠️ Worried",
    sleeping: "😴 Sleeping",
  };
  return labels[mood] || "😊 Idle";
}