# 🎲 TycoonVale — Premium Real-Time Multiplayer Property Board Game

**TycoonVale** is an art-directed digital tabletop multiplayer property trading board game built from the ground up to rival and surpass experiences like Richup.io. Designed with authentic digital tabletop aesthetics—warm mahogany, deep baize felt, gold leaf accents, brass borders, and classical serif display typography—TycoonVale abandons generic SaaS card dashboards in favor of rich atmospheric game design, server-authoritative rules, 4 distinct board themes, team mode, and zero-mandatory-registration guest sessions.

---

## 🌟 Key Highlights & Features

- **Art-Directed Digital Tabletop Design**: Handcrafted warm ivory, deep forest green, dark burgundy, rich navy, muted gold foil, brass inlays, and classical serif typography (`Cinzel Decorative`, `Playfair Display`). Completely rejects generic SaaS blue-purple card grids.
- **The Tycoon's Atelier (Player Customization)**: 
  - **20 Hand-Drawn SVG Avatars**: Vector portraits of distinctive tycoons, heiresses, barons, moguls, and visionaries (no generic emojis).
  - **12 Sculpted 3D-Styled SVG Figurines**: Crown, Rocket, Cat, Diamond, Steam Train, Galleon Ship, Top Hat, Dragon, Luxury Car, Automaton, Treasure Chest, and Pocket Watch.
  - **8 Distinct Accessible Colors**: Emerald, Crimson, Sapphire, Amber, Royal Violet, Rose Quartz, Teal, and Warm Gold.
- **4 Distinct Switchable Board Themes**:
  1. *Classic Tabletop*: Warm mahogany wood, deep felt green, and polished brass inlays.
  2. *Modern Luxury*: Dark slate, brushed champagne gold accents, and sleek marble borders.
  3. *Neon Metropolis*: Midnight obsidian, neon cyan and magenta luminous trims.
  4. *Forest Estate*: Deep moss green, weathered dark timber, and antique parchment.
- **Geometrically Authentic 40-Tile Square Board**: 11×11 CSS Grid layout with 4 corners (GO, Detention Center, Grand Plaza Park, Court Sanction / Go To Jail), 8 color property districts, 4 transit rail links, 2 municipal utilities, 2 tax spaces, and Fortune/Opportunity card decks.
- **Step-by-Step Movement Animation**: Dynamic token interpolation stepping tile-by-tile around the board (140ms per step) with synchronized audio footsteps, GO passage coin chimes, and active tile tracking.
- **Free Parking Jackpot Pool**: When toggled by the host, all municipal wealth taxes, luxury duties, card fees, and detention bail accumulate in the central Jackpot pool. Landing directly on Tile 20 claims the entire jackpot!
- **Team Mode (2v2, 3v3)**: Players can align under the Gold or Silver cartels. Teammate net worth is aggregated, and the cartel wins once all rival players are eliminated.
- **Dynamic Multi-Player Auctions**: When a player lands on an unowned property and declines purchase, a live timed auction opens for all players with anti-snipe time extensions (+8s on late bids).
- **Bilateral Property & Cash Trading**: Propose trades offering properties and cash in exchange for a target player's properties and cash with atomic server transactions.
- **Detention (Jail) System**: Land on Tile 30, roll 3 consecutive doubles, or draw a court summons to be detained. Escape by paying $50 bail, using an Executive Pardon Pass, or rolling doubles.
- **Real-Time Multiplayer (4–6 Players)**: Create private rooms, copy shareable invite links, and sync player actions with sub-50ms Socket.IO latency.
- **Zero Mandatory Login**: Instant guest session with persistent identities across browser reloads via secure temporary session handling.
- **Synthesized Web Audio Sound Effects**: 100% self-contained Web Audio API synthesizers for dice rolls, token footsteps, coin payments, property purchases, jail buzzers, and victory fanfares.
- **Mobile & Desktop Responsive**: Auto-scaling square board on desktop with zoom/pan controls (85%–145%), sliding chat drawer with unread counters, and mobile tab bar.
- **Free-Tier Ready**: Ready for deployment on **Vercel** (Frontend), **Render** (Backend), and **MongoDB Atlas** (Database).

---

## 🏛️ System Architecture

```
tycoonvale/
├── client/                     # Vite + React 18 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Artwork/        # 20 Vector SVG Avatars & 12 Sculpted SVG Tokens
│   │   │   ├── Board/          # GameBoard (11x11 Grid), BoardTile, CenterArea
│   │   │   ├── HUD/            # PlayerRoster, ActivityLogFeed, ChatBox
│   │   │   ├── Modals/         # PropertyDetail, Auction, Trade, Card, GameOver, HowToPlay
│   │   │   └── Navbar.tsx      # Tabletop brass trim with unread chat toggle & audio
│   │   ├── context/            # GameContext (reactive state & socket dispatchers)
│   │   ├── pages/              # LandingPage, LobbyPage, GamePage
│   │   ├── styles/             # themes.ts (4 tabletop color palettes & borders)
│   │   └── services/           # audio.ts (Web Audio), socket.ts, session.ts
│   ├── vercel.json             # Vercel SPA rewrite config
│   └── vite.config.ts
├── server/                     # Node.js + Express + Socket.IO + Mongoose
│   ├── src/
│   │   ├── config/             # Environment & CORS configuration
│   │   ├── models/             # User, GameSession, Statistics schemas
│   │   ├── services/           # GameService, RoomManager, PersistenceService
│   │   ├── sockets/            # Socket.IO event controllers
│   │   └── server.ts           # Server entrypoint & HTTP health-check
│   └── render.yaml             # Render blueprint configuration
├── shared/                     # Shared TypeScript Engine & Contracts
│   ├── src/
│   │   ├── constants/          # 40 Board Tiles, Fortune & Opportunity Card decks
│   │   ├── game-engine/        # Rent calculations, even building, mortgages, net worth
│   │   └── types/              # GameState, Player, BoardTile, SocketEvents contracts
└── tests/                      # Automated Test Suite (33 Tests)
    ├── engine.test.ts          # Vitest suite for pure game engine rules (25 tests)
    └── socket.test.ts          # Vitest suite for real-time Socket.IO multiplayer flows (8 tests)
```

---

## 🎲 Board Layout & Original Properties (40 Tiles)

| Tile Index | Name | Type / Group | Price | Key Mechanic |
| :---: | :--- | :--- | :---: | :--- |
| **0** | **GO: STARTING POINT** | Corner (GO) | — | Collect $200 when passing or landing |
| **1** | Harbor Alley | Brown Group | $60 | Base Rent: $2 (Monopoly: $4) |
| **2** | Opportunity Vault | Card Deck | — | Draw an Opportunity Card |
| **3** | Beacon Wharf | Brown Group | $60 | Base Rent: $4 (Monopoly: $8) |
| **4** | Municipal Wealth Tax | Tax | — | Pay $200 flat fee to Treasury |
| **5** | Metro Central Station | Transit Station | $200 | Rent: $25 / $50 / $100 / $200 |
| **6** | Cobalt Terrace | Light Blue Group | $100 | Base Rent: $6 |
| **7** | Fortune Chest | Card Deck | — | Draw a Fortune Card |
| **8** | Azure Avenue | Light Blue Group | $100 | Base Rent: $6 |
| **9** | Skyline Way | Light Blue Group | $120 | Base Rent: $8 |
| **10** | **Detention Center** | Corner (Jail) | — | Just Visiting or Serving Detention |
| **11** | Orchid Boulevard | Pink Group | $140 | Base Rent: $10 |
| **12** | Volt Energy Grid | Utility | $150 | 4x or 10x Dice Roll |
| **13** | Lotus Promenade | Pink Group | $140 | Base Rent: $10 |
| **14** | Magnolia Plaza | Pink Group | $160 | Base Rent: $12 |
| **15** | Aero Skyport Express | Transit Station | $200 | Rent: $25 / $50 / $100 / $200 |
| **16** | Amber Ridge | Orange Group | $180 | Base Rent: $14 |
| **17** | Opportunity Vault | Card Deck | — | Draw an Opportunity Card |
| **18** | Copper Square | Orange Group | $180 | Base Rent: $14 |
| **19** | Sienna Heights | Orange Group | $200 | Base Rent: $16 |
| **20** | **Grand Plaza Park** | Corner (Parking) | — | Safe Resting Zone |
| **21** | Ruby Boulevard | Red Group | $220 | Base Rent: $18 |
| **22** | Fortune Chest | Card Deck | — | Draw a Fortune Card |
| **23** | Scarlet Row | Red Group | $220 | Base Rent: $18 |
| **24** | Crimson Court | Red Group | $240 | Base Rent: $20 |
| **25** | High-Speed Rail Link | Transit Station | $200 | Rent: $25 / $50 / $100 / $200 |
| **26** | Solaris Promenade | Yellow Group | $260 | Base Rent: $22 |
| **27** | Aureolin Way | Yellow Group | $260 | Base Rent: $22 |
| **28** | Aqua Reservoir Works | Utility | $150 | 4x or 10x Dice Roll |
| **29** | Gilded Parkway | Yellow Group | $280 | Base Rent: $24 |
| **30** | **Court Sanction** | Corner (Go To Jail)| — | Sent directly to Detention Center |
| **31** | Emerald Crest | Green Group | $300 | Base Rent: $26 |
| **32** | Jade Parkway | Green Group | $300 | Base Rent: $26 |
| **33** | Opportunity Vault | Card Deck | — | Draw an Opportunity Card |
| **34** | Verdant Summit | Green Group | $320 | Base Rent: $28 |
| **35** | Interstellar Hyperloop | Transit Station | $200 | Rent: $25 / $50 / $100 / $200 |
| **36** | Fortune Chest | Card Deck | — | Draw a Fortune Card |
| **37** | Obsidian Heights | Dark Blue Group | $350 | Base Rent: $35 |
| **38** | Billionaire Luxury Duty| Tax | — | Pay $100 Luxury Surcharge |
| **39** | Diamond Pinnacle | Dark Blue Group | $400 | Base Rent: $50 (Hotel Rent: $2,000) |

---

## 🚀 Local Development Quickstart

### Prerequisites
- Node.js v18+ (tested on Node.js 24)
- npm v9+

### 1. Build Shared Module
```bash
cd shared
npm install
npm run build
```

### 2. Start Backend Server
```bash
cd ../server
npm install
npm run build
npm start
# Server listens on http://localhost:4000
# Health check: http://localhost:4000/api/health
```

### 3. Start Frontend Client
```bash
cd ../client
npm install
npm run dev
# Vite runs at http://localhost:5173
```

Open `http://localhost:5173` in your browser. Open multiple private browsing windows or separate browsers to test 4–6 player multiplayer in real time!

---

## 🧪 Automated Testing

TycoonVale includes a Vitest test suite covering both deterministic game engine state transitions and real-time Socket.IO communication:

```bash
# Run pure game engine tests (25 tests covering movement, rent, monopolies, jail, bankruptcy, jackpot, team mode)
cd server
npx vitest run ../tests/engine.test.ts

# Run real-time Socket.IO multiplayer networking tests (8 tests covering room creation, join, ready, settings sync, team selection, chat, dice rolls, and reconnect)
npx vitest run ../tests/socket.test.ts
```

---

## 🌐 100% Free-Tier Production Deployment Guide

### Service 1: Database (MongoDB Atlas — Free M0 Tier)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. Create a new Shared Cluster (**M0 Sandbox — Free Forever**).
3. Under **Database Access**, create a database user (e.g. `tycoon_admin` with password).
4. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) to permit Render backend connections.
5. Click **Connect** -> **Drivers (Node.js)** and copy your connection string:
   ```
   mongodb+srv://tycoon_admin:<password>@cluster0.mongodb.net/tycoonvale?retryWrites=true&w=majority
   ```
> *Note:* If `MONGODB_URI` is omitted, TycoonVale automatically operates in high-speed in-memory persistence mode without crashing.

---

### Service 2: Backend (Render — Free Web Service)
1. Go to [render.com](https://render.com) and create an account.
2. Click **New +** -> **Web Service** and connect your GitHub repository.
3. Configure the settings:
   - **Name**: `tycoonvale-backend`
   - **Region**: Closest to your users (e.g., Oregon or Frankfurt)
   - **Runtime**: `Node`
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     cd shared && npm install && npm run build && cd ../server && npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     cd server && npm start
     ```
   - **Instance Type**: `Free`
4. Add Environment Variables:
   - `PORT`: `10000`
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-frontend.vercel.app` (or `*` during initial testing)
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
5. Click **Deploy Web Service**.
6. Note your Render URL: e.g. `https://tycoonvale-backend.onrender.com`. Test health at `https://tycoonvale-backend.onrender.com/api/health`.

---

### Service 3: Frontend (Vercel — Free Hobby Tier)
1. Go to [vercel.com](https://vercel.com) and connect your GitHub account.
2. Click **Add New Project** and import the `tycoonvale` repository.
3. In project settings:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_SERVER_URL`: `https://tycoonvale-backend.onrender.com` (Your deployed Render backend URL)
5. Click **Deploy**. Vercel will build and serve your app globally on a CDN with SSL.

---

## 🔒 Security & Reliability Architecture

- **Zero Trust Frontend**: Clients only transmit player intentions (`game:roll`, `game:buy_property`, `auction:bid`). Balances, positions, and deeds can never be manipulated by client-side code.
- **Atomic Concurrency**: Transactions and auction bids are checked against current real-time state before mutating balances or deeds.
- **Graceful Reconnection**: Player session tokens are saved in `localStorage`. Reconnecting sockets automatically rebind to their existing seat without disrupting the game.
- **Anti-Sniping Auction Logic**: Bids submitted in the final 8 seconds automatically extend the auction countdown timer.
- **Memory Fallback**: Production server runs flawlessly even if MongoDB Atlas experiences network latency, seamlessly falling back to in-memory snapshots.
