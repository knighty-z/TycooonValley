import React, { useState, useEffect } from 'react';
import type { TokenDef, WorldThemeId } from '../../themes/types.js';

const preloadedSrcs = new Set<string>();
const failedSrcs = new Set<string>();

/**
 * Preloads raster token sprites (e.g. VALORANT agent PNGs) into the browser cache
 * once per session so tokens appear on the board without flicker.
 */
export function preloadWorldTokenImages(tokens: TokenDef[]): void {
  if (typeof window === 'undefined') return;
  for (const tok of tokens) {
    if (!tok.imageSrc || preloadedSrcs.has(tok.imageSrc)) continue;
    preloadedSrcs.add(tok.imageSrc);
    const img = new Image();
    img.onerror = () => {
      failedSrcs.add(tok.imageSrc!);
      console.warn(
        `[TycoonVale] Failed to preload token image "${tok.imageSrc}" for "${tok.name}". Using initial emblem fallback.`
      );
    };
    img.src = tok.imageSrc;
  }
}

export interface WorldTokenProps {
  tokenId: string;
  tokenDef?: TokenDef;
  worldId?: WorldThemeId;
  color: string;
  size?: number;
  className?: string;
}

/**
 * Renders any world's figurine token:
 * - For sprite-backed tokens (VALORANT agents in /public/tokens/valorant/*.png),
 *   renders the exact transparent PNG sprite scaled consistently and centered,
 *   falling back cleanly to an initial emblem + console.warn if missing.
 * - For sculpted vector tokens (Original, India, Cyberpunk), renders rich
 *   world-material figurines on a player-colored pedestal ring.
 */
export const WorldTokenIcon: React.FC<WorldTokenProps> = React.memo(
  ({ tokenId, tokenDef, worldId = 'original', color, size = 34, className = '' }) => {
    const src = tokenDef?.imageSrc;
    const [imgBroken, setImgBroken] = useState<boolean>(() => Boolean(src && failedSrcs.has(src)));

    useEffect(() => {
      setImgBroken(Boolean(src && failedSrcs.has(src)));
    }, [src]);

    // 1. Sprite-backed billboard token (VALORANT agents)
    if (src) {
      if (!imgBroken) {
        return (
          <div
            className={`relative inline-flex items-end justify-center select-none ${className}`}
            style={{ width: size, height: size }}
            data-token-sprite={tokenId}
          >
            {/* Single thin, clean player-colored ring at the base (no heavy neon bloom) */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: worldId === 'wompwomp' ? '8%' : 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '72%',
                height: '20%',
                borderRadius: '9999px',
                border: `1.5px solid ${color}`,
                backgroundColor: 'rgba(10, 16, 23, 0.35)'
              }}
            />
            <img
              src={src}
              alt={tokenDef?.name ?? tokenId}
              draggable={false}
              decoding="async"
              onError={() => {
                if (!failedSrcs.has(src)) {
                  failedSrcs.add(src);
                  console.warn(
                    `[TycoonVale] Token image missing or failed to load: "${src}" (${tokenDef?.name ?? tokenId}). Rendering placeholder emblem.`
                  );
                }
                setImgBroken(true);
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center bottom',
                filter:
                  'brightness(1.02) contrast(1.04) drop-shadow(0 0 1px rgba(7, 11, 16, 0.95)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.58))',
                position: 'relative',
                zIndex: 1
              }}
            />
          </div>
        );
      }

      // Graceful placeholder emblem if image file is missing or fails to load
      const initial = (tokenDef?.initial || tokenDef?.name?.[0] || tokenId[0] || '?').toUpperCase();
      return (
        <div
          className={`inline-flex items-center justify-center font-bold select-none ${className}`}
          data-token-fallback={tokenId}
          style={{
            width: size,
            height: size,
            backgroundColor: '#1C2B38',
            color: '#ECE8E1',
            border: `2px solid ${color}`,
            clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
            fontSize: Math.max(11, Math.round(size * 0.42)),
            boxShadow: `0 2px 6px rgba(0,0,0,0.45)`
          }}
          title={tokenDef?.name ?? tokenId}
        >
          {initial}
        </div>
      );
    }

    // 2. Sculpted World SVG Pieces (Original, India, Cyberpunk)
    const isCyber = worldId === 'cyberpunk';
    const isIndia = worldId === 'india';
    const baseFill = isCyber ? '#101324' : isIndia ? '#FFF4DC' : '#FAF3DF';
    const strokeInk = isCyber ? '#19F0FF' : isIndia ? '#4A2511' : '#1E2D24';
    const primaryFill = isCyber ? '#19F0FF' : isIndia ? '#F29A2E' : '#D4AF37';
    const secondaryFill = isCyber ? '#FF2BD6' : isIndia ? '#1F8A5B' : '#2F7D4F';
    const accentLight = isCyber ? '#E8EAF6' : '#FFFDF8';

    const renderSculptedPiece = () => {
      switch (tokenId) {
        // ---- ORIGINAL (Gold, Ivory & Emerald luxury pieces) ----
        case 'tophat':
          return (
            <g>
              <rect x="11" y="7" width="14" height="14" rx="1.5" fill="#1E2D24" stroke="#D4AF37" strokeWidth="1.2" />
              <rect x="11" y="16.5" width="14" height="3" fill="#2F7D4F" />
              <rect x="6.5" y="20.5" width="23" height="3.6" rx="1.8" fill="#D4AF37" stroke="#1E2D24" strokeWidth="1.1" />
              <path d="M13.5 9.5V15" stroke="#FAF3DF" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
            </g>
          );
        case 'car':
          return (
            <g>
              <path d="M7 20.5L9.5 14.5H13L15.5 10.5H23.5L26 15.5L29 17V21H7Z" fill="#2F7D4F" stroke="#1E2D24" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M15.5 12H22.5L24.2 15H14Z" fill="#FAF3DF" />
              <circle cx="12" cy="22" r="2.8" fill="#1E2D24" stroke="#D4AF37" strokeWidth="1.3" />
              <circle cx="24" cy="22" r="2.8" fill="#1E2D24" stroke="#D4AF37" strokeWidth="1.3" />
            </g>
          );
        case 'ship':
        case 'yacht':
          return (
            <g>
              <path d="M18 6.5L26 17.5H18V6.5Z" fill="#FAF3DF" stroke="#1E2D24" strokeWidth="1.1" strokeLinejoin="round" />
              <path d="M16.5 9.5L10.5 17.5H16.5V9.5Z" fill="#D4AF37" stroke="#1E2D24" strokeWidth="1.1" strokeLinejoin="round" />
              <path d="M7 19.5H29L25.5 24.5H10.5L7 19.5Z" fill="#2F7D4F" stroke="#1E2D24" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M10.5 21.5H25.5" stroke="#D4AF37" strokeWidth="1.2" />
            </g>
          );
        case 'crown':
          return (
            <g>
              <path d="M8 22L6.5 11.5L12.5 16L18 8.5L23.5 16L29.5 11.5L28 22H8Z" fill="#D4AF37" stroke="#1E2D24" strokeWidth="1.2" strokeLinejoin="round" />
              <rect x="8" y="21.5" width="20" height="3.2" rx="1" fill="#FAF3DF" stroke="#1E2D24" strokeWidth="1.1" />
              <circle cx="18" cy="17.5" r="2" fill="#2F7D4F" stroke="#1E2D24" strokeWidth="0.9" />
            </g>
          );
        case 'key':
          return (
            <g>
              <circle cx="13" cy="15.5" r="5" fill="#D4AF37" stroke="#1E2D24" strokeWidth="1.2" />
              <circle cx="13" cy="15.5" r="2" fill="#2F7D4F" />
              <path d="M18 15.5H29V19.5H26.5V17.5H24V20H21.5V17.5H18Z" fill="#D4AF37" stroke="#1E2D24" strokeWidth="1.1" strokeLinejoin="round" />
            </g>
          );
        case 'chess':
          return (
            <g>
              <path d="M12 22.5C12.5 18 15.5 16.5 16 14.5C14 14.8 11.5 14 11 12.2C11.5 9.2 15.5 7 19.5 7.5C23 8 25 11 24.5 15C24 18 22.5 19.5 23.5 22.5H12Z" fill="#FAF3DF" stroke="#1E2D24" strokeWidth="1.2" strokeLinejoin="round" />
              <rect x="10" y="22.5" width="16" height="3" rx="1.2" fill="#D4AF37" stroke="#1E2D24" strokeWidth="1.1" />
              <circle cx="16.2" cy="10.8" r="1" fill="#1E2D24" />
            </g>
          );

        // ---- INDIA (Warm terracotta, saffron, emerald, ivory & gold) ----
        case 'elephant':
          return (
            <g>
              <path d="M9.5 22.5V14.5C9.5 10.5 13 8.5 17.5 8.5C21.5 8.5 24 10.5 24.5 14L27.5 16.5C28.2 17.5 27.5 19.5 26 19.5C24.5 19.5 24 18 23.5 17V22.5H20V18.5H15V22.5H9.5Z" fill="#A5523A" stroke="#2A1F14" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M13 11.5H20V16H13Z" fill="#F29A2E" stroke="#2A1F14" strokeWidth="0.9" />
              <circle cx="22" cy="12" r="1" fill="#FFFDF8" />
            </g>
          );
        case 'lotus':
          return (
            <g>
              <path d="M18 7.5C21 12 21.5 16.5 18 21.5C14.5 16.5 15 12 18 7.5Z" fill="#D6336C" stroke="#2A1F14" strokeWidth="1.1" />
              <path d="M11 11.5C15 13 17 16.5 17 21.5C12.5 20.5 10 16.5 11 11.5Z" fill="#F29A2E" stroke="#2A1F14" strokeWidth="1.1" />
              <path d="M25 11.5C21 13 19 16.5 19 21.5C23.5 20.5 26 16.5 25 11.5Z" fill="#F29A2E" stroke="#2A1F14" strokeWidth="1.1" />
              <path d="M8.5 18.5C12 18 15 19.5 18 22.5C21 19.5 24 18 27.5 18.5C25 23 21.5 24.5 18 24.5C14.5 24.5 11 23 8.5 18.5Z" fill="#1F8A5B" stroke="#2A1F14" strokeWidth="1.1" />
            </g>
          );
        case 'rickshaw':
          return (
            <g>
              <path d="M8.5 21V13.5L13 9H23L26.5 14V21H8.5Z" fill="#F29A2E" stroke="#2A1F14" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M8.5 16.5H26.5V21H8.5Z" fill="#1F8A5B" stroke="#2A1F14" strokeWidth="1" />
              <path d="M14 10.5H22L24 14.5H14Z" fill="#FFFDF8" />
              <circle cx="12.5" cy="22.5" r="2.4" fill="#2A1F14" stroke="#E8B923" strokeWidth="1.1" />
              <circle cx="23.5" cy="22.5" r="2.4" fill="#2A1F14" stroke="#E8B923" strokeWidth="1.1" />
            </g>
          );
        case 'peacock':
          return (
            <g>
              <path d="M9 17A9 9 0 0 1 27 17L18 22.5Z" fill="#1F8A5B" stroke="#2A1F14" strokeWidth="1.1" />
              <circle cx="13" cy="13" r="1.5" fill="#E8B923" />
              <circle cx="18" cy="11" r="1.5" fill="#3FA7B5" />
              <circle cx="23" cy="13" r="1.5" fill="#E8B923" />
              <path d="M18 13.5C19.5 13.5 20.5 15 20 17.5L21 23.5H15L16 17.5C15.5 15 16.5 13.5 18 13.5Z" fill="#2C3F8F" stroke="#2A1F14" strokeWidth="1.1" />
              <circle cx="18" cy="15.2" r="0.9" fill="#FFFDF8" />
            </g>
          );
        case 'temple':
          return (
            <g>
              <path d="M18 6.5L19.5 9.5H16.5L18 6.5Z" fill="#E8B923" stroke="#2A1F14" strokeWidth="0.9" />
              <path d="M11 20C11.5 14 14 10.5 18 9.5C22 10.5 24.5 14 25 20H11Z" fill="#F29A2E" stroke="#2A1F14" strokeWidth="1.2" />
              <path d="M15 20V16A3 3 0 0 1 21 16V20" fill="#A5523A" stroke="#2A1F14" strokeWidth="1" />
              <rect x="8.5" y="20" width="19" height="4" rx="1" fill="#E8B923" stroke="#2A1F14" strokeWidth="1.1" />
            </g>
          );
        case 'kite':
          return (
            <g>
              <polygon points="18,6 27,14.5 18,23 9,14.5" fill="#D6336C" stroke="#2A1F14" strokeWidth="1.2" />
              <polygon points="18,6 27,14.5 18,14.5" fill="#F29A2E" />
              <polygon points="18,14.5 9,14.5 18,23" fill="#3FA7B5" />
              <path d="M18 6V23M9 14.5H27" stroke="#2A1F14" strokeWidth="1" />
              <path d="M18 23L15.5 26.5H20.5Z" fill="#E8B923" stroke="#2A1F14" strokeWidth="0.9" />
            </g>
          );

        // ---- CYBERPUNK (Obsidian metallic with restrained cyan & magenta glow) ----
        case 'drone':
          return (
            <g>
              <path d="M10 10L15 15M26 10L21 15M10 24L15 19M26 24L21 19" stroke="#19F0FF" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="10" cy="10" r="2.6" fill="#101324" stroke="#FF2BD6" strokeWidth="1.4" />
              <circle cx="26" cy="10" r="2.6" fill="#101324" stroke="#FF2BD6" strokeWidth="1.4" />
              <circle cx="10" cy="24" r="2.6" fill="#101324" stroke="#FF2BD6" strokeWidth="1.4" />
              <circle cx="26" cy="24" r="2.6" fill="#101324" stroke="#FF2BD6" strokeWidth="1.4" />
              <polygon points="18,12 22.5,17 18,22 13.5,17" fill="#19F0FF" stroke="#07070F" strokeWidth="1" />
            </g>
          );
        case 'mech':
          return (
            <g>
              <polygon points="11,9 25,9 27.5,16 24,24 12,24 8.5,16" fill="#1A1D36" stroke="#19F0FF" strokeWidth="1.3" strokeLinejoin="round" />
              <rect x="11.5" y="14" width="13" height="3.2" rx="1" fill="#FF2BD6" />
              <path d="M15 20.5H21" stroke="#19F0FF" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M18 6V9" stroke="#19F0FF" strokeWidth="1.5" />
            </g>
          );
        case 'hover_car':
          return (
            <g>
              <path d="M6.5 19L11 12H25L29.5 19H6.5Z" fill="#1A1D36" stroke="#19F0FF" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M12.5 13.5H23.5L25.5 17H10.5Z" fill="#FF2BD6" fillOpacity="0.75" />
              <path d="M9 22.5H15M21 22.5H27" stroke="#19F0FF" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          );
        case 'chip':
        case 'data_core':
          return (
            <g>
              <rect x="11" y="10" width="14" height="14" rx="1.5" fill="#1A1D36" stroke="#19F0FF" strokeWidth="1.3" />
              <rect x="14.5" y="13.5" width="7" height="7" fill="#FF2BD6" />
              <path d="M14 7V10M18 7V10M22 7V10M14 24V27M18 24V27M22 24V27M8 14H11M8 20H11M25 14H28M25 20H28" stroke="#19F0FF" strokeWidth="1.3" />
            </g>
          );
        case 'robot':
        case 'cyborg':
          return (
            <g>
              <rect x="11" y="8" width="14" height="10" rx="2" fill="#1A1D36" stroke="#19F0FF" strokeWidth="1.3" />
              <circle cx="15" cy="13" r="1.7" fill="#19F0FF" />
              <circle cx="21" cy="13" r="1.7" fill="#FF2BD6" />
              <path d="M12.5 19.5H23.5L25 25H11Z" fill="#23284A" stroke="#19F0FF" strokeWidth="1.2" />
            </g>
          );
        case 'holo_glyph':
          return (
            <g>
              <polygon points="18,6.5 27,12 27,22 18,27.5 9,22 9,12" fill="none" stroke="#19F0FF" strokeWidth="1.5" />
              <polygon points="18,10.5 23.5,17 18,23.5 12.5,17" fill="#FF2BD6" fillOpacity="0.82" stroke="#E8EAF6" strokeWidth="1" />
              <circle cx="18" cy="17" r="2" fill="#19F0FF" />
            </g>
          );

        default:
          return (
            <g>
              <polygon points="18,7 26,17 18,27 10,17" fill={primaryFill} stroke={strokeInk} strokeWidth="1.3" />
              <circle cx="18" cy="17" r="3" fill={secondaryFill} stroke={accentLight} strokeWidth="1" />
            </g>
          );
      }
    };

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        className={`shrink-0 ${className}`}
        style={{
          filter: isCyber
            ? 'drop-shadow(0 0 1px rgba(7, 7, 15, 0.9)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.55))'
            : 'drop-shadow(0 0 1px rgba(10, 12, 10, 0.75)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.48))'
        }}
        aria-hidden="true"
      >
        {/* Inner world-material sculpted disc with one thin, crisp player-colored ring */}
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill={baseFill}
          stroke={color}
          strokeWidth="2.4"
        />
        <circle
          cx="18"
          cy="18"
          r="16.8"
          fill="none"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth="0.8"
        />
        {/* Soft specular top sheen */}
        <path
          d="M9 12.5A11.5 11.5 0 0 1 27 12.5"
          fill="none"
          stroke="rgba(255,255,255,0.34)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {renderSculptedPiece()}
      </svg>
    );
  }
);

WorldTokenIcon.displayName = 'WorldTokenIcon';
