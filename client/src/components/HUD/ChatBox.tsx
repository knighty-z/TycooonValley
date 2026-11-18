import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { ActivityLog, ChatMessage, GameState, Player } from '@tycoonvale/shared';
import { useGame } from '../../context/GameContext.js';
import {
  getThemeConfig,
  resolveUniquePlayerColors,
  resolveWorldTokensForPlayers,
  type ThemeConfig
} from '../../themes/index.js';
import { WorldTokenIcon } from '../Icons/WorldTokens.js';
import {
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  Dices,
  ShoppingBag,
  Coins,
  Lock,
  Sparkles,
  Skull,
  ArrowLeftRight,
  Gavel,
  Building2,
  Info
} from 'lucide-react';

export interface ChatBoxProps {
  gameState?: GameState;
  localPlayer?: Player | null;
  themeConfig?: ThemeConfig;
  onSendChat?: (text: string, isReaction?: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  unreadCount?: number;
  onResetUnread?: () => void;
  className?: string;
}

type FeedEntry =
  | { kind: 'chat'; id: string; timestamp: number; msg: ChatMessage }
  | { kind: 'system'; id: string; timestamp: number; text: string; eventType: ActivityLog['type'] };

const MAX_MESSAGE_LENGTH = 200;

function getSystemIcon(type: ActivityLog['type']) {
  switch (type) {
    case 'roll':
    case 'move':
      return Dices;
    case 'buy':
      return ShoppingBag;
    case 'rent':
    case 'tax':
      return Coins;
    case 'jail':
      return Lock;
    case 'card':
      return Sparkles;
    case 'bankrupt':
      return Skull;
    case 'trade':
      return ArrowLeftRight;
    case 'auction':
      return Gavel;
    case 'house':
    case 'mortgage':
      return Building2;
    default:
      return Info;
  }
}

function formatClock(ts: number): string {
  try {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '';
  }
}

export const ChatBox: React.FC<ChatBoxProps> = React.memo(
  ({
    gameState: propGameState,
    localPlayer: propLocalPlayer,
    themeConfig: propThemeConfig,
    onSendChat: propOnSendChat,
    isCollapsed: propIsCollapsed,
    onToggleCollapse: propOnToggleCollapse,
    unreadCount: propUnreadCount,
    onResetUnread: propOnResetUnread,
    className = ''
  }) => {
    // Only call useGame if not provided via props (prevents coupling in standalone preview/tests)
    let ctx: ReturnType<typeof useGame> | null = null;
    try {
      ctx = useGame();
    } catch {
      ctx = null;
    }

    const gameState = propGameState ?? ctx?.gameState ?? null;
    const localPlayer = propLocalPlayer !== undefined ? propLocalPlayer : ctx?.player ?? null;
    const sendChat = propOnSendChat ?? ctx?.sendChat;
    const externalUnread = propUnreadCount ?? ctx?.unreadChatCount ?? 0;
    const resetUnread = propOnResetUnread ?? ctx?.resetUnreadChatCount;

    const [internalCollapsed, setInternalCollapsed] = useState(false);
    const isCollapsed = propIsCollapsed ?? internalCollapsed;
    const toggleCollapse = useCallback(() => {
      if (propOnToggleCollapse) {
        propOnToggleCollapse();
      } else {
        setInternalCollapsed(prev => !prev);
      }
    }, [propOnToggleCollapse]);

    const [input, setInput] = useState('');
    const [isNearBottom, setIsNearBottom] = useState(true);
    const [pendingBelowCount, setPendingBelowCount] = useState(0);
    const [collapsedUnread, setCollapsedUnread] = useState(0);

    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const prevFeedCountRef = useRef<number>(0);
    const prevChatCountRef = useRef<number>(gameState?.chatMessages.length ?? 0);

    const theme = useMemo(
      () => propThemeConfig ?? (gameState ? getThemeConfig(gameState.settings.theme) : getThemeConfig('original')),
      [propThemeConfig, gameState]
    );

    const colorMap = useMemo(
      () => (gameState ? resolveUniquePlayerColors(gameState.players) : {}),
      [gameState]
    );

    const tokenMap = useMemo(
      () => (gameState ? resolveWorldTokensForPlayers(gameState.players, theme.tokens) : {}),
      [gameState, theme.tokens]
    );

    // Chronological feed merging muted system events and player chat messages
    const feed = useMemo<FeedEntry[]>(() => {
      if (!gameState) return [];
      const entries: FeedEntry[] = [];

      for (const log of gameState.activityLogs.slice(0, 28)) {
        entries.push({
          kind: 'system',
          id: `sys-${log.id}`,
          timestamp: log.timestamp,
          text: log.text,
          eventType: log.type
        });
      }

      for (const msg of gameState.chatMessages) {
        if (msg.isSystem || msg.senderId === 'system') {
          entries.push({
            kind: 'system',
            id: `chat-sys-${msg.id}`,
            timestamp: msg.timestamp,
            text: msg.text,
            eventType: 'system'
          });
        } else {
          entries.push({
            kind: 'chat',
            id: `chat-${msg.id}`,
            timestamp: msg.timestamp,
            msg
          });
        }
      }

      entries.sort((a, b) => a.timestamp - b.timestamp);
      return entries;
    }, [gameState]);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
      const el = scrollContainerRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior });
      setIsNearBottom(true);
      setPendingBelowCount(0);
    }, []);

    // Track unread messages while collapsed
    useEffect(() => {
      const currentChatCount = gameState?.chatMessages.length ?? 0;
      const diff = currentChatCount - prevChatCountRef.current;
      prevChatCountRef.current = currentChatCount;

      if (diff > 0 && isCollapsed) {
        setCollapsedUnread(prev => prev + diff);
      }
    }, [gameState?.chatMessages.length, isCollapsed]);

    // Clear unread count when expanded
    useEffect(() => {
      if (!isCollapsed) {
        setCollapsedUnread(0);
        resetUnread?.();
        // Scroll to latest on initial expand
        const raf = requestAnimationFrame(() => scrollToBottom('auto'));
        return () => cancelAnimationFrame(raf);
      }
      return undefined;
    }, [isCollapsed, resetUnread, scrollToBottom]);

    // Smart auto-scroll when new entries arrive (never yank if user scrolled up)
    useEffect(() => {
      const count = feed.length;
      const delta = count - prevFeedCountRef.current;
      prevFeedCountRef.current = count;

      if (delta <= 0 || isCollapsed) return;

      if (isNearBottom) {
        const raf = requestAnimationFrame(() => scrollToBottom('smooth'));
        return () => cancelAnimationFrame(raf);
      } else {
        setPendingBelowCount(prev => prev + delta);
      }
      return undefined;
    }, [feed.length, isCollapsed, isNearBottom, scrollToBottom]);

    const handleScroll = useCallback(() => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const atBottom = distanceFromBottom <= 36;
      setIsNearBottom(atBottom);
      if (atBottom) {
        setPendingBelowCount(0);
      }
    }, []);

    const handleSubmit = (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || !sendChat) return;
      sendChat(trimmed.slice(0, MAX_MESSAGE_LENGTH), false);
      setInput('');
      setPendingBelowCount(0);
      setIsNearBottom(true);
      requestAnimationFrame(() => scrollToBottom('smooth'));
    };

    const handleQuickReaction = (phrase: string) => {
      if (!sendChat) return;
      sendChat(phrase, true);
      setPendingBelowCount(0);
      setIsNearBottom(true);
      requestAnimationFrame(() => scrollToBottom('smooth'));
    };

    if (!gameState) return null;

    const totalUnread = Math.max(collapsedUnread, isCollapsed ? externalUnread : 0);
    const headingTransform = theme.fonts.headingUppercase ? 'uppercase' : 'none';

    return (
      <section
        aria-label="In-Game Chat"
        data-testid="phase-e-chat"
        data-chamfered={theme.chamfered ? 'true' : 'false'}
        className={`tv-hud-panel flex flex-col overflow-hidden ${isCollapsed ? 'shrink-0' : 'flex-1 min-h-0'} ${className}`}
      >
        {/* Header with Collapse/Expand Toggle + Unread Badge */}
        <div
          style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 50%, transparent)' }}
          className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                textTransform: headingTransform
              }}
              className="text-xs font-bold tracking-wider truncate"
            >
              {theme.hud.chatTitle}
            </h2>
            {isCollapsed && totalUnread > 0 && (
              <span
                data-testid="chat-unread-badge"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#0B1218',
                  borderRadius: 'var(--radius-tile)'
                }}
                className="px-1.5 py-0.5 text-[10px] font-extrabold leading-none tabular-nums"
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={toggleCollapse}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand chat' : 'Collapse chat'}
            data-testid="chat-collapse-toggle"
            className="tv-hud-focus p-1 rounded opacity-80 hover:opacity-100 transition"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsible Chat Body */}
        {!isCollapsed && (
          <div className="flex-1 min-h-0 flex flex-col relative">
            {/* Scrollable Messages Stream */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              data-testid="chat-message-list"
              className="flex-1 min-h-0 overflow-y-auto tv-hud-scroll px-2.5 py-2 space-y-2"
            >
              {feed.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center px-3">
                  <p className="text-xs opacity-60">
                    No messages yet. Say hello or send a quick callout below.
                  </p>
                </div>
              ) : (
                feed.map(entry => {
                  if (entry.kind === 'system') {
                    const SysIcon = getSystemIcon(entry.eventType);
                    return (
                      <div
                        key={entry.id}
                        data-testid="chat-system-message"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--bg) 52%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--tile-border) 32%, transparent)',
                          borderRadius: 'var(--radius-tile)'
                        }}
                        className="flex items-start gap-1.5 px-2 py-1 border text-[11px] leading-snug opacity-75"
                      >
                        <SysIcon
                          className="w-3 h-3 shrink-0 mt-0.5 opacity-80"
                          style={{ color: 'var(--accent)' }}
                        />
                        <span className="flex-1 min-w-0 break-words">{entry.text}</span>
                      </div>
                    );
                  }

                  const { msg } = entry;
                  const isMe = localPlayer?.id === msg.senderId;
                  const senderColor = colorMap[msg.senderId]?.hex ?? msg.senderColor;
                  const senderToken = tokenMap[msg.senderId];
                  const senderPlayer = gameState.players.find(p => p.id === msg.senderId);

                  return (
                    <div
                      key={entry.id}
                      data-testid="chat-player-message"
                      className="flex items-start gap-2 text-xs"
                    >
                      {/* Sender World Token Avatar */}
                      <div
                        className="w-6 h-6 shrink-0 flex items-center justify-center mt-0.5 overflow-hidden"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--bg) 88%, var(--board))',
                          border: `1.5px solid ${senderColor}`,
                          borderRadius: theme.chamfered ? '2px' : '9999px'
                        }}
                      >
                        <WorldTokenIcon
                          tokenId={senderToken?.id ?? senderPlayer?.token ?? theme.tokens[0].id}
                          tokenDef={senderToken}
                          worldId={theme.id}
                          color={senderColor}
                          size={senderToken?.imageSrc ? 22 : 17}
                        />
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className="text-[11px] font-bold truncate"
                            style={{ color: senderColor }}
                          >
                            {msg.senderName}
                            {isMe && <span className="opacity-65 font-normal ml-1">(you)</span>}
                          </span>
                          <span className="text-[9px] opacity-45 tabular-nums shrink-0">
                            {formatClock(msg.timestamp)}
                          </span>
                        </div>
                        <div
                          style={{
                            backgroundColor: msg.isReaction
                              ? `color-mix(in srgb, ${senderColor} 16%, var(--bg))`
                              : isMe
                              ? 'color-mix(in srgb, var(--accent) 14%, var(--bg))'
                              : 'color-mix(in srgb, var(--bg) 78%, var(--board))',
                            borderColor: msg.isReaction
                              ? `color-mix(in srgb, ${senderColor} 55%, transparent)`
                              : 'color-mix(in srgb, var(--tile-border) 38%, transparent)',
                            borderRadius: 'var(--radius-tile)'
                          }}
                          className={`mt-0.5 px-2 py-1 border break-words leading-snug ${
                            msg.isReaction
                              ? 'inline-block text-[11px] font-bold uppercase tracking-wider'
                              : 'text-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Floating "New messages" Jump Pill when scrolled up */}
            {!isNearBottom && pendingBelowCount > 0 && (
              <div className="absolute bottom-[82px] left-1/2 -translate-x-1/2 z-20">
                <button
                  type="button"
                  data-testid="chat-new-messages-btn"
                  onClick={() => scrollToBottom('smooth')}
                  data-chamfered={theme.chamfered ? 'true' : 'false'}
                  className="tv-hud-btn tv-hud-btn-primary px-2.5 py-1 text-[10px] shadow-lg"
                >
                  <ArrowDown className="w-3 h-3" />
                  <span>
                    {pendingBelowCount} new {pendingBelowCount === 1 ? 'message' : 'messages'}
                  </span>
                </button>
              </div>
            )}

            {/* Emoji-Free Themed Quick Reaction Chips */}
            <div
              style={{ borderColor: 'color-mix(in srgb, var(--tile-border) 38%, transparent)' }}
              className="px-2.5 pt-1.5 pb-1 border-t flex items-center gap-1 flex-wrap shrink-0"
            >
              {theme.hud.quickReactions.map(phrase => (
                <button
                  key={phrase}
                  type="button"
                  disabled={!sendChat}
                  onClick={() => handleQuickReaction(phrase)}
                  data-testid={`quick-reaction-${phrase}`}
                  data-chamfered={theme.chamfered ? 'true' : 'false'}
                  className="tv-hud-btn tv-hud-btn-secondary px-2 py-0.5 text-[10px] tracking-wide"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Bottom Message Input Form */}
            <form
              onSubmit={handleSubmit}
              className="px-2.5 pb-2.5 pt-1 flex items-center gap-1.5 shrink-0"
            >
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Say something..."
                  maxLength={MAX_MESSAGE_LENGTH}
                  aria-label="Chat message"
                  data-testid="chat-input"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--bg) 90%, #000000)',
                    borderColor: 'color-mix(in srgb, var(--tile-border) 65%, transparent)',
                    color: 'var(--board-ink)',
                    borderRadius: 'var(--radius-button)'
                  }}
                  className="tv-hud-focus w-full border px-2.5 py-1.5 text-xs placeholder:opacity-50"
                />
                {input.length >= 160 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] opacity-60 tabular-nums pointer-events-none">
                    {MAX_MESSAGE_LENGTH - input.length}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={!input.trim() || !sendChat}
                aria-label="Send message"
                data-testid="chat-send-btn"
                data-chamfered={theme.chamfered ? 'true' : 'false'}
                className="tv-hud-btn tv-hud-btn-primary p-2 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </section>
    );
  }
);

ChatBox.displayName = 'ChatBox';
