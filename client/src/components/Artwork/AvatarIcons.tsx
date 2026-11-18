import React from 'react';

export interface AvatarDefinition {
  id: string;
  name: string;
  title: string;
  Component: React.FC<{ className?: string }>;
}

export const AVATAR_DEFINITIONS: AvatarDefinition[] = [
  {
    id: 'avatar-tycoon',
    name: 'Lord Sterling',
    title: 'The Grand Tycoon',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#1C2438" stroke="#D4AF37" strokeWidth="2.5" />
        {/* Face */}
        <circle cx="50" cy="56" r="22" fill="#E8C39E" />
        {/* Hair / Beard */}
        <path d="M32 50C32 40 68 40 68 50C68 52 64 54 64 54C60 48 40 48 36 54C36 54 32 52 32 50Z" fill="#C5CCD6" />
        <path d="M42 66C42 66 46 72 50 72C54 72 58 66 58 66C56 70 54 74 50 74C46 74 44 70 42 66Z" fill="#C5CCD6" />
        {/* Monocle */}
        <circle cx="56" cy="55" r="7" fill="none" stroke="#D4AF37" strokeWidth="2" />
        <line x1="62" y1="58" x2="68" y2="70" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="1 1" />
        {/* Eyes & Mustache */}
        <circle cx="44" cy="54" r="2" fill="#1A202C" />
        <circle cx="56" cy="55" r="2" fill="#1A202C" />
        <path d="M40 62C44 60 48 62 50 63C52 62 56 60 60 62C62 64 58 66 50 65C42 66 38 64 40 62Z" fill="#C5CCD6" />
        {/* Top Hat */}
        <ellipse cx="50" cy="42" rx="26" ry="6" fill="#111827" stroke="#D4AF37" strokeWidth="1.5" />
        <path d="M34 42L36 18H64L66 42" fill="#1F2937" />
        <rect x="35" y="34" width="30" height="6" fill="#B91C1C" />
        <circle cx="50" cy="37" r="3" fill="#D4AF37" />
        {/* Tuxedo Collar */}
        <path d="M28 88C32 76 44 72 50 76C56 72 68 76 72 88" fill="#111827" />
        <polygon points="50,78 45,86 55,86" fill="#DC2626" />
      </svg>
    )
  },
  {
    id: 'avatar-heiress',
    name: 'Lady Vivienne',
    title: 'The High Stakes Heiress',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#2E1026" stroke="#F472B6" strokeWidth="2.5" />
        {/* Face */}
        <circle cx="50" cy="54" r="20" fill="#FDDCB5" />
        {/* Hair */}
        <path d="M26 58C24 40 34 26 50 26C66 26 76 40 74 58C72 70 70 76 68 80C66 74 64 64 64 56C58 48 42 48 36 56C36 64 34 74 32 80C30 76 28 70 26 58Z" fill="#831843" />
        {/* Tiara */}
        <path d="M38 34L44 26L50 32L56 26L62 34Z" fill="#D4AF37" stroke="#FEF08A" strokeWidth="1" />
        <circle cx="50" cy="30" r="2" fill="#38BDF8" />
        {/* Eyes & Lips */}
        <circle cx="43" cy="53" r="2.5" fill="#1E293B" />
        <circle cx="57" cy="53" r="2.5" fill="#1E293B" />
        <path d="M46 64C48 66 52 66 54 64" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" />
        {/* Pearl Necklace */}
        <circle cx="42" cy="74" r="2.5" fill="#FFFFFF" />
        <circle cx="46" cy="76" r="2.5" fill="#FFFFFF" />
        <circle cx="50" cy="77" r="3" fill="#38BDF8" stroke="#D4AF37" strokeWidth="1" />
        <circle cx="54" cy="76" r="2.5" fill="#FFFFFF" />
        <circle cx="58" cy="74" r="2.5" fill="#FFFFFF" />
      </svg>
    )
  },
  {
    id: 'avatar-baron',
    name: 'Col. Vance',
    title: 'The Oil Baron',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#2E1C0C" stroke="#D97706" strokeWidth="2.5" />
        {/* Face */}
        <circle cx="50" cy="56" r="21" fill="#E2A772" />
        {/* Stetson Hat */}
        <ellipse cx="50" cy="38" rx="30" ry="7" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
        <path d="M32 38C34 22 42 16 50 16C58 16 66 22 68 38Z" fill="#F1F5F9" />
        <rect x="36" y="34" width="28" height="4" fill="#78350F" />
        {/* Eyes & Thick Mustache */}
        <circle cx="43" cy="52" r="2" fill="#0F172A" />
        <circle cx="57" cy="52" r="2" fill="#0F172A" />
        <path d="M38 60C44 58 50 63 50 63C50 63 56 58 62 60C66 65 58 68 50 66C42 68 34 65 38 60Z" fill="#F8FAFC" />
        {/* Cigar */}
        <rect x="52" y="64" width="14" height="4" rx="1.5" transform="rotate(15 52 64)" fill="#78350F" stroke="#F59E0B" strokeWidth="0.8" />
        <circle cx="66" cy="68" r="1.5" fill="#EF4444" />
      </svg>
    )
  },
  {
    id: 'avatar-broker',
    name: 'Gordon Chase',
    title: 'The Wall Street Broker',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#0F243A" stroke="#38BDF8" strokeWidth="2.5" />
        {/* Face */}
        <circle cx="50" cy="54" r="21" fill="#F3CA9D" />
        {/* Slick Hair */}
        <path d="M30 46C30 30 40 22 54 22C68 22 72 32 72 44C66 40 56 40 46 44C38 46 32 46 30 46Z" fill="#33241C" />
        {/* Eyes & Smirk */}
        <circle cx="43" cy="52" r="2.5" fill="#0F172A" />
        <circle cx="57" cy="52" r="2.5" fill="#0F172A" />
        <path d="M46 62C48 64 54 64 56 61" stroke="#881337" strokeWidth="2" strokeLinecap="round" />
        {/* Suspenders & Tie */}
        <path d="M30 88L36 74L44 74L40 88" fill="#DC2626" />
        <path d="M70 88L64 74L56 74L60 88" fill="#DC2626" />
        <polygon points="50,72 47,84 50,88 53,84" fill="#D4AF37" />
      </svg>
    )
  },
  {
    id: 'avatar-visionary',
    name: 'Aria Thorne',
    title: 'The Tech Visionary',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#0A1828" stroke="#10B981" strokeWidth="2.5" />
        {/* Face */}
        <circle cx="50" cy="54" r="20" fill="#E7B992" />
        {/* Sharp Bob Hair */}
        <path d="M26 48C26 30 40 22 50 22C60 22 74 30 74 48C74 62 70 72 68 76C68 76 66 56 60 52C54 48 46 48 40 52C34 56 32 76 32 76C30 72 26 62 26 48Z" fill="#111827" />
        {/* Cyber Hologram Glasses */}
        <rect x="36" y="48" width="28" height="9" rx="2" fill="#059669" fillOpacity="0.4" stroke="#10B981" strokeWidth="1.5" />
        <line x1="36" y1="52" x2="64" y2="52" stroke="#6EE7B7" strokeWidth="0.8" />
        {/* Turtleneck */}
        <path d="M38 72H62V88H38Z" fill="#18181B" />
        <circle cx="50" cy="78" r="2.5" fill="#10B981" />
      </svg>
    )
  },
  {
    id: 'avatar-monarch',
    name: 'King Aurelius',
    title: 'The Sovereign Monarch',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#3B0A12" stroke="#EAB308" strokeWidth="2.5" />
        {/* Face */}
        <circle cx="50" cy="58" r="20" fill="#FAD2B0" />
        {/* Crown */}
        <path d="M30 40L34 22L42 32L50 18L58 32L66 22L70 40Z" fill="#EAB308" stroke="#FEF08A" strokeWidth="1.5" />
        <circle cx="50" cy="23" r="2.5" fill="#EF4444" />
        <circle cx="37" cy="27" r="2" fill="#3B82F6" />
        <circle cx="63" cy="27" r="2" fill="#10B981" />
        {/* Beard */}
        <path d="M34 56C34 76 46 80 50 80C54 80 66 76 66 56C64 62 60 68 50 68C40 68 36 62 34 56Z" fill="#D4AF37" />
        <circle cx="43" cy="54" r="2" fill="#1F2937" />
        <circle cx="57" cy="54" r="2" fill="#1F2937" />
      </svg>
    )
  },
  {
    id: 'avatar-queen',
    name: 'Queen Seraphina',
    title: 'The Sovereign Queen',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#1F1538" stroke="#C084FC" strokeWidth="2.5" />
        <circle cx="50" cy="56" r="19" fill="#FCE7D0" />
        {/* Diadem */}
        <path d="M34 38L42 26L50 34L58 26L66 38Z" fill="#A855F7" stroke="#E9D5FF" strokeWidth="1.2" />
        <circle cx="50" cy="30" r="3" fill="#FBBF24" />
        {/* Flowing Platinum Hair */}
        <path d="M26 48C26 30 38 24 50 24C62 24 74 30 74 48C74 66 76 80 72 86C68 76 66 66 64 58C60 52 40 52 36 58C34 66 32 76 28 86C24 80 26 66 26 48Z" fill="#E2E8F0" />
        <circle cx="44" cy="54" r="2.5" fill="#475569" />
        <circle cx="56" cy="54" r="2.5" fill="#475569" />
        <path d="M47 65C49 67 51 67 53 65" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'avatar-captain',
    name: 'Admiral Cross',
    title: 'The Maritime Captain',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#0C253B" stroke="#0284C7" strokeWidth="2.5" />
        <circle cx="50" cy="56" r="20" fill="#E4AA76" />
        {/* Naval Cap */}
        <path d="M28 42C28 28 40 22 50 22C60 22 72 28 72 42Z" fill="#F8FAFC" />
        <rect x="26" y="38" width="48" height="6" fill="#0F172A" />
        <polygon points="50,37 47,43 53,43" fill="#EAB308" />
        <ellipse cx="50" cy="46" rx="28" ry="4" fill="#020617" />
        {/* Eye Patch */}
        <circle cx="57" cy="54" r="2" fill="#0F172A" />
        <polygon points="38,48 48,50 46,58 36,56" fill="#0F172A" />
        <line x1="28" y1="46" x2="66" y2="58" stroke="#0F172A" strokeWidth="1.5" />
        {/* Silver Beard */}
        <path d="M38 66C44 74 56 74 62 66C62 72 56 76 50 76C44 76 38 72 38 66Z" fill="#CBD5E1" />
      </svg>
    )
  },
  {
    id: 'avatar-casino',
    name: 'Lucky Luciano',
    title: 'The Casino Mogul',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#1C1427" stroke="#EC4899" strokeWidth="2.5" />
        <circle cx="50" cy="54" r="21" fill="#F2C192" />
        {/* Dark Fedora */}
        <ellipse cx="50" cy="40" rx="30" ry="6" fill="#18181B" stroke="#EC4899" strokeWidth="1" />
        <path d="M32 40C34 26 42 22 50 22C58 22 66 26 68 40Z" fill="#27272A" />
        <rect x="35" y="36" width="30" height="4" fill="#DB2777" />
        {/* Sunglasses */}
        <polygon points="36,48 47,48 45,56 38,56" fill="#09090B" stroke="#F43F5E" strokeWidth="1" />
        <polygon points="53,48 64,48 62,56 55,56" fill="#09090B" stroke="#F43F5E" strokeWidth="1" />
        <line x1="47" y1="50" x2="53" y2="50" stroke="#F43F5E" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 'avatar-railway',
    name: 'Barnaby Drake',
    title: 'The Railway Magnate',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#291811" stroke="#F59E0B" strokeWidth="2.5" />
        <circle cx="50" cy="56" r="20" fill="#E8B88A" />
        {/* Conductor Cap */}
        <path d="M30 42C30 30 40 24 50 24C60 24 70 30 70 42Z" fill="#3B261D" />
        <rect x="28" y="38" width="44" height="5" fill="#78350F" />
        <circle cx="50" cy="40.5" r="3" fill="#F59E0B" />
        <ellipse cx="50" cy="45" rx="26" ry="4" fill="#1C1917" />
        {/* Brass Goggles on forehead */}
        <circle cx="42" cy="34" r="5" fill="#451A03" stroke="#F59E0B" strokeWidth="1.5" />
        <circle cx="58" cy="34" r="5" fill="#451A03" stroke="#F59E0B" strokeWidth="1.5" />
        <line x1="47" y1="34" x2="53" y2="34" stroke="#78350F" strokeWidth="2" />
        {/* Walrus Mustache */}
        <path d="M36 62C42 60 50 64 50 64C50 64 58 60 64 62C66 68 54 70 50 68C46 70 34 68 36 62Z" fill="#92400E" />
      </svg>
    )
  },
  {
    id: 'avatar-miner',
    name: 'Gus McGoldrick',
    title: 'The Klondike Prospector',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#2E2010" stroke="#CA8A04" strokeWidth="2.5" />
        <circle cx="50" cy="56" r="20" fill="#DCA06E" />
        {/* Slouch Felt Hat */}
        <ellipse cx="50" cy="42" rx="28" ry="6" fill="#713F12" />
        <path d="M34 42C36 28 42 22 50 22C58 22 64 28 66 42Z" fill="#854D0E" />
        {/* Bushy Red Beard */}
        <path d="M32 54C32 78 44 84 50 84C56 84 68 78 68 54C64 60 60 64 50 64C40 64 36 60 32 54Z" fill="#C2410C" />
        <circle cx="44" cy="52" r="2" fill="#1C1917" />
        <circle cx="56" cy="52" r="2" fill="#1C1917" />
      </svg>
    )
  },
  {
    id: 'avatar-architect',
    name: 'Marcus Stone',
    title: 'The Urban Architect',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#142132" stroke="#60A5FA" strokeWidth="2.5" />
        <circle cx="50" cy="54" r="20" fill="#ECC097" />
        {/* Neat Hair */}
        <path d="M30 44C30 30 40 24 50 24C60 24 70 30 70 44C66 40 58 40 50 40C42 40 34 40 30 44Z" fill="#334155" />
        {/* Designer Round Glasses */}
        <circle cx="43" cy="52" r="6" fill="none" stroke="#F8FAFC" strokeWidth="1.5" />
        <circle cx="57" cy="52" r="6" fill="none" stroke="#F8FAFC" strokeWidth="1.5" />
        <line x1="49" y1="52" x2="51" y2="52" stroke="#F8FAFC" strokeWidth="1.5" />
        {/* Architect Ruler in lapel */}
        <rect x="36" y="74" width="28" height="14" fill="#0284C7" />
        <line x1="56" y1="72" x2="62" y2="82" stroke="#FACC15" strokeWidth="2" />
      </svg>
    )
  },
  {
    id: 'avatar-shadow',
    name: 'V. R. Sinclair',
    title: 'The Shadow Banker',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#0A0E17" stroke="#64748B" strokeWidth="2.5" />
        <circle cx="50" cy="56" r="20" fill="#C29B7F" />
        {/* Low-pulled Dark Fedora */}
        <ellipse cx="50" cy="44" rx="30" ry="6" fill="#090D16" />
        <path d="M32 44C34 26 44 20 50 20C56 20 66 26 68 44Z" fill="#111827" />
        {/* Shadow over eyes with glowing glasses */}
        <path d="M30 44H70V56H30Z" fill="#030712" />
        <line x1="38" y1="50" x2="48" y2="50" stroke="#F59E0B" strokeWidth="2" />
        <line x1="52" y1="50" x2="62" y2="50" stroke="#F59E0B" strokeWidth="2" />
      </svg>
    )
  },
  {
    id: 'avatar-crypto',
    name: 'Satoshi Satoshi',
    title: 'The Crypto Sovereign',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#131B2E" stroke="#818CF8" strokeWidth="2.5" />
        <circle cx="50" cy="54" r="20" fill="#F0CAA0" />
        <path d="M30 48C30 30 42 22 50 22C58 22 70 30 70 48C66 42 56 42 50 42C44 42 34 42 30 48Z" fill="#4F46E5" />
        {/* Geometric VR Goggles */}
        <polygon points="34,48 66,48 62,58 38,58" fill="#1E1B4B" stroke="#A5B4FC" strokeWidth="1.5" />
        <circle cx="50" cy="53" r="2.5" fill="#38BDF8" />
      </svg>
    )
  },
  {
    id: 'avatar-aviator',
    name: 'Capt. Amelia',
    title: 'The Aviation Pioneer',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#2E180E" stroke="#EA580C" strokeWidth="2.5" />
        <circle cx="50" cy="56" r="20" fill="#ECC097" />
        {/* Leather Flight Helmet */}
        <path d="M28 50C28 32 38 24 50 24C62 24 72 32 72 50C72 64 68 72 68 72L64 56C60 52 40 52 36 56L32 72C32 72 28 64 28 50Z" fill="#78350F" />
        {/* Aviator Goggles */}
        <circle cx="42" cy="38" r="6" fill="#BAE6FD" stroke="#D97706" strokeWidth="1.5" />
        <circle cx="58" cy="38" r="6" fill="#BAE6FD" stroke="#D97706" strokeWidth="1.5" />
        <line x1="48" y1="38" x2="52" y2="38" stroke="#78350F" strokeWidth="3" />
        {/* Scarf */}
        <path d="M38 72C44 70 56 70 62 72L66 84H34Z" fill="#F8FAFC" />
      </svg>
    )
  },
  {
    id: 'avatar-industrialist',
    name: 'Magnus Forge',
    title: 'The Steel Titan',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#1C212A" stroke="#94A3B8" strokeWidth="2.5" />
        <circle cx="50" cy="56" r="20" fill="#E2A676" />
        {/* Steel Cap */}
        <path d="M30 42C30 28 40 22 50 22C60 22 70 28 70 42Z" fill="#64748B" stroke="#CBD5E1" strokeWidth="1.5" />
        {/* Gear Emblem */}
        <circle cx="50" cy="32" r="4" fill="#D97706" />
        {/* Smudged Cheek & Stubble */}
        <ellipse cx="40" cy="62" rx="3" ry="1.5" fill="#334155" fillOpacity="0.5" />
        <circle cx="44" cy="52" r="2" fill="#0F172A" />
        <circle cx="56" cy="52" r="2" fill="#0F172A" />
      </svg>
    )
  },
  {
    id: 'avatar-mayor',
    name: 'Hon. Reginald',
    title: 'The City Mayor',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#15241C" stroke="#22C55E" strokeWidth="2.5" />
        <circle cx="50" cy="54" r="21" fill="#F3CCA2" />
        {/* Dignified White Hair */}
        <path d="M28 50C28 34 38 26 50 26C62 26 72 34 72 50C68 44 58 44 50 44C42 44 32 44 28 50Z" fill="#F1F5F9" />
        {/* Friendly eyes & Spectacles */}
        <rect x="37" y="48" width="10" height="7" rx="1.5" fill="none" stroke="#D4AF37" strokeWidth="1.2" />
        <rect x="53" y="48" width="10" height="7" rx="1.5" fill="none" stroke="#D4AF37" strokeWidth="1.2" />
        <line x1="47" y1="51" x2="53" y2="51" stroke="#D4AF37" strokeWidth="1.2" />
        {/* Green Mayoral Sash */}
        <polygon points="34,88 66,74 70,88" fill="#15803D" />
      </svg>
    )
  },
  {
    id: 'avatar-baroness',
    name: 'Countess Camille',
    title: 'The Estate Baroness',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#2E1424" stroke="#F43F5E" strokeWidth="2.5" />
        <circle cx="50" cy="56" r="20" fill="#FDE1CA" />
        {/* Elaborate Updo with Peacock Feather */}
        <circle cx="50" cy="34" r="16" fill="#262626" />
        <path d="M58 24C68 14 74 16 78 8C72 16 68 20 62 26Z" fill="#0D9488" stroke="#2DD4BF" strokeWidth="1" />
        <circle cx="78" cy="8" r="2" fill="#F59E0B" />
        <circle cx="44" cy="54" r="2" fill="#1C1917" />
        <circle cx="56" cy="54" r="2" fill="#1C1917" />
        <path d="M47 64C49 66 51 66 53 64" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'avatar-aristocrat',
    name: 'Duke Montgomery',
    title: 'The Venture Duke',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#1A1833" stroke="#8B5CF6" strokeWidth="2.5" />
        <circle cx="50" cy="56" r="20" fill="#ECC5A0" />
        {/* Powdered Wig / Curled Hair */}
        <circle cx="34" cy="46" r="6" fill="#F8FAFC" />
        <circle cx="32" cy="54" r="5" fill="#F8FAFC" />
        <circle cx="66" cy="46" r="6" fill="#F8FAFC" />
        <circle cx="68" cy="54" r="5" fill="#F8FAFC" />
        <path d="M34 44C34 28 42 22 50 22C58 22 66 28 66 44Z" fill="#F1F5F9" />
        {/* Aristocratic Cravat */}
        <polygon points="50,74 42,86 58,86" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="1" />
      </svg>
    )
  },
  {
    id: 'avatar-explorer',
    name: 'Sir Jonathan',
    title: 'The Global Merchant',
    Component: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="46" fill="#1F2417" stroke="#84CC16" strokeWidth="2.5" />
        <circle cx="50" cy="56" r="20" fill="#E2AC7E" />
        {/* Pith Helmet */}
        <ellipse cx="50" cy="42" rx="28" ry="6" fill="#E2E8F0" />
        <path d="M34 42C36 26 44 20 50 20C56 20 64 26 66 42Z" fill="#F8FAFC" />
        <circle cx="50" cy="20" r="2.5" fill="#D4AF37" />
        {/* Compass Necklace */}
        <circle cx="50" cy="78" r="4" fill="#D4AF37" stroke="#FEF08A" strokeWidth="1" />
        <polygon points="50,75 51,78 50,81 49,78" fill="#EF4444" />
      </svg>
    )
  }
];

export function getAvatarById(id: string): AvatarDefinition {
  return AVATAR_DEFINITIONS.find(a => a.id === id) || AVATAR_DEFINITIONS[0];
}
