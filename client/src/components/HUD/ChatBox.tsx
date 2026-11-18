import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext.js';
import { getAvatarById } from '../Artwork/AvatarIcons.js';
import { MessageSquare, Send, Sparkles, X } from 'lucide-react';

const REACTION_EMOJIS = ['🔥', '💸', '💀', '🎲', '🤝', '👑', '🎉', '📉'];

export const ChatBox: React.FC = () => {
  const { 
    gameState, 
    player, 
    sendChat, 
    isChatDrawerOpen, 
    setIsChatDrawerOpen,
    resetUnreadChatCount 
  } = useGame();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState?.chatMessages.length]);

  if (!gameState || !player) return null;

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendChat(input.trim());
    setInput('');
  };

  const handleQuickReaction = (emoji: string) => {
    sendChat(emoji, true);
  };

  const content = (
    <div className="bg-[#0F2218] border-2 border-[#4A3828] rounded-2xl p-3 sm:p-4 flex flex-col h-[340px] sm:h-[300px] shadow-xl">
      <div className="flex items-center justify-between border-b border-[#3B281A] pb-2 mb-2">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-xs font-serif uppercase tracking-widest text-[#D4AF37]">
            Table Chamber Chat
          </span>
        </div>
        {isChatDrawerOpen && (
          <button 
            onClick={() => { setIsChatDrawerOpen(false); resetUnreadChatCount(); }}
            className="lg:hidden p-1 text-[#C8BCAB] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2">
        {gameState.chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-serif text-[#655745] text-center p-4">
            The council chamber is quiet. Enter your remarks to your fellow tycoons.
          </div>
        ) : (
          gameState.chatMessages.map((msg) => {
            const isMe = msg.senderId === player.id;
            const isSystem = msg.isSystem || msg.senderId === 'system';
            const avatar = getAvatarById(msg.senderAvatar);

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center py-1">
                  <div className="inline-block bg-[#1B3526]/80 border border-[#D4AF37]/30 rounded-lg px-2.5 py-0.5 text-[10px] font-serif text-[#FCE794]">
                    <span className="mr-1">📜</span>
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col text-xs ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1.5 text-[10px] text-[#A99D8D] mb-0.5 font-serif">
                  <div className="w-3.5 h-3.5 rounded-full overflow-hidden inline-block">
                    <avatar.Component className="w-full h-full" />
                  </div>
                  <span style={{ color: msg.senderColor }} className="font-bold">
                    {msg.senderName}
                  </span>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-xl max-w-[85%] break-words font-sans ${
                    msg.isReaction
                      ? 'text-2xl py-0.5 bg-transparent'
                      : isMe
                      ? 'bg-[#1E4D34] text-white rounded-tr-none border border-[#3A7552]'
                      : 'bg-[#0A160F] text-[#EDE6D6] rounded-tl-none border border-[#2D3E32]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reaction Bar */}
      <div className="flex items-center space-x-1 mb-2 overflow-x-auto py-1 border-t border-[#1C2C22]">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleQuickReaction(emoji)}
            className="p-1 rounded hover:bg-[#1E3B2B] text-sm transition transform active:scale-90"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Whisper to the table..."
          maxLength={150}
          className="flex-1 bg-[#0A160F] border border-[#3B281A] rounded-xl px-3 py-1.5 text-xs text-white font-sans focus:outline-none focus:border-[#D4AF37] transition"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#12241A] font-bold disabled:opacity-40 transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Desktop view */}
      <div className="hidden lg:block">
        {content}
      </div>

      {/* Mobile slide-out drawer overlay */}
      {isChatDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-full max-w-sm h-full bg-[#0E1E16] p-4 flex flex-col justify-end animate-in slide-in-from-right duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
