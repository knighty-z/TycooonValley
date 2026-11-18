import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { registerSocketHandlers } from '../server/src/sockets/index.js';
import { SOCKET_EVENTS, GuestSession } from '../shared/src/types/index.js';

describe('TycoonVale Real-Time Multiplayer Networking', () => {
  let server: http.Server;
  let io: Server;
  let port: number;
  let client1: ClientSocket;
  let client2: ClientSocket;

  const session1: GuestSession = {
    sessionId: 'sess_1',
    nickname: 'HostTycoon',
    avatar: 'avatar-1',
    token: 'jet',
    color: '#3B82F6'
  };

  const session2: GuestSession = {
    sessionId: 'sess_2',
    nickname: 'GuestTycoon',
    avatar: 'avatar-2',
    token: 'supercar',
    color: '#EF4444'
  };

  beforeAll(async () => {
    const app = express();
    server = http.createServer(app);
    io = new Server(server, {
      cors: { origin: '*' }
    });
    registerSocketHandlers(io);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as any;
        port = address.port;
        resolve();
      });
    });

    client1 = Client(`http://localhost:${port}`, { transports: ['websocket'] });
    client2 = Client(`http://localhost:${port}`, { transports: ['websocket'] });

    await Promise.all([
      new Promise<void>((resolve) => client1.on('connect', resolve)),
      new Promise<void>((resolve) => client2.on('connect', resolve))
    ]);
  });

  afterAll(() => {
    client1.disconnect();
    client2.disconnect();
    io.close();
    server.close();
  });

  it('allows client1 to create a private multiplayer room', async () => {
    const res: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.ROOM_CREATE, { session: session1 }, resolve);
    });

    expect(res.success).toBe(true);
    expect(res.gameState.roomCode).toBeDefined();
    expect(res.gameState.players.length).toBe(1);
    expect(res.gameState.players[0].isHost).toBe(true);
    expect(res.gameState.players[0].nickname).toBe('HostTycoon');
  });

  it('allows client2 to join existing room using room code', async () => {
    // First create room
    const createRes: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.ROOM_CREATE, { session: session1 }, resolve);
    });
    const roomCode = createRes.gameState.roomCode;

    // Client2 joins
    const joinRes: any = await new Promise((resolve) => {
      client2.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode, session: session2 }, resolve);
    });

    expect(joinRes.success).toBe(true);
    expect(joinRes.gameState.players.length).toBe(2);
    expect(joinRes.player.isHost).toBe(false);
    expect(joinRes.player.nickname).toBe('GuestTycoon');
  });

  it('allows player to toggle ready status and allows host to start match', async () => {
    const createRes: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.ROOM_CREATE, { session: session1 }, resolve);
    });
    const roomCode = createRes.gameState.roomCode;

    await new Promise((resolve) => {
      client2.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode, session: session2 }, resolve);
    });

    // Client 2 toggles ready
    const readyRes: any = await new Promise((resolve) => {
      client2.emit(SOCKET_EVENTS.PLAYER_READY, { roomCode, isReady: true }, resolve);
    });
    expect(readyRes.success).toBe(true);

    // Host starts game
    const startRes: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.GAME_START, { roomCode }, resolve);
    });
    expect(startRes.success).toBe(true);
  });

  it('synchronizes host settings updates and theme switching across all clients', async () => {
    const createRes: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.ROOM_CREATE, { session: session1 }, resolve);
    });
    const roomCode = createRes.gameState.roomCode;

    await new Promise((resolve) => {
      client2.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode, session: session2 }, resolve);
    });

    // Listen for state update on client2
    const client2UpdatePromise = new Promise<any>((resolve) => {
      client2.once(SOCKET_EVENTS.GAME_STATE_UPDATE, (state: any) => resolve(state));
    });

    // Host updates theme to 'luxury' and enables freeParkingJackpot
    const updateRes: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.SETTINGS_UPDATE, {
        roomCode,
        settings: {
          theme: 'luxury',
          freeParkingJackpot: true,
          startingBalance: 2000
        }
      }, resolve);
    });
    expect(updateRes.success).toBe(true);

    const receivedState = await client2UpdatePromise;
    expect(receivedState.settings.theme).toBe('luxury');
    expect(receivedState.settings.freeParkingJackpot).toBe(true);
    expect(receivedState.settings.startingBalance).toBe(2000);
  });

  it('supports team selection and synchronizes team rosters', async () => {
    const createRes: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.ROOM_CREATE, { session: session1 }, resolve);
    });
    const roomCode = createRes.gameState.roomCode;

    await new Promise((resolve) => {
      client2.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode, session: session2 }, resolve);
    });

    // Client 1 joins Gold team
    const teamRes1: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.PLAYER_SET_TEAM, { roomCode, team: 'gold' }, resolve);
    });
    expect(teamRes1.success).toBe(true);

    // Client 2 joins Silver team
    const teamRes2: any = await new Promise((resolve) => {
      client2.emit(SOCKET_EVENTS.PLAYER_SET_TEAM, { roomCode, team: 'silver' }, resolve);
    });
    expect(teamRes2.success).toBe(true);
  });

  it('broadcasts real-time chat messages between players with sender attribution', async () => {
    const createRes: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.ROOM_CREATE, { session: session1 }, resolve);
    });
    const roomCode = createRes.gameState.roomCode;

    await new Promise((resolve) => {
      client2.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode, session: session2 }, resolve);
    });

    const client2ChatPromise = new Promise<any>((resolve) => {
      client2.once(SOCKET_EVENTS.GAME_STATE_UPDATE, (state: any) => {
        const lastChat = state.chatMessages[state.chatMessages.length - 1];
        if (lastChat && lastChat.text === 'Greetings from Host!') {
          resolve(lastChat);
        }
      });
    });

    // Client 1 sends chat
    const chatRes: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.CHAT_SEND, {
        roomCode,
        text: 'Greetings from Host!',
        isReaction: false
      }, resolve);
    });
    expect(chatRes.success).toBe(true);

    const receivedChat = await client2ChatPromise;
    expect(receivedChat.senderName).toBe('HostTycoon');
    expect(receivedChat.text).toBe('Greetings from Host!');
  });

  it('executes full in-game dice roll, movement broadcast, and turn transition', async () => {
    const createRes: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.ROOM_CREATE, { session: session1 }, resolve);
    });
    const roomCode = createRes.gameState.roomCode;

    await new Promise((resolve) => {
      client2.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode, session: session2 }, resolve);
    });

    // Ready up both and start game
    await new Promise((resolve) => {
      client2.emit(SOCKET_EVENTS.PLAYER_READY, { roomCode, isReady: true }, resolve);
    });
    await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.GAME_START, { roomCode }, resolve);
    });

    // Set up listeners for dice animation & player move animation on client2
    const diceAnimPromise = new Promise<any>((resolve) => {
      client2.once(SOCKET_EVENTS.DICE_ROLLED_ANIMATION, (data: any) => resolve(data));
    });
    const moveAnimPromise = new Promise<any>((resolve) => {
      client2.once(SOCKET_EVENTS.PLAYER_MOVED_ANIMATION, (data: any) => resolve(data));
    });

    // Client 1 rolls dice
    const rollRes: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.DICE_ROLL, resolve);
    });
    expect(rollRes.success).toBe(true);
    expect(rollRes.dice).toHaveLength(2);
    expect(rollRes.newPosition).toBeGreaterThan(0);

    const diceAnim = await diceAnimPromise;
    expect(diceAnim.dice).toEqual(rollRes.dice);

    const moveAnim = await moveAnimPromise;
    expect(moveAnim.toPosition).toBe(rollRes.newPosition);
    expect(moveAnim.fromPosition).toBe(0);

    // If client 1 landed on unowned property, decline or buy to allow turn end
    if (rollRes.mustResolve) {
      await new Promise((resolve) => {
        client1.emit(SOCKET_EVENTS.PROPERTY_DECLINE, { tileId: rollRes.newPosition }, resolve);
      });
    }

    // Client 1 ends turn if allowed
    const endRes: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.TURN_END, resolve);
    });
    // If not double, turn ends successfully
    if (!rollRes.isDouble) {
      expect(endRes.success).toBe(true);
    }
  });

  it('preserves player identity across disconnect and supports session reconnect', async () => {
    const createRes: any = await new Promise((resolve) => {
      client1.emit(SOCKET_EVENTS.ROOM_CREATE, { session: session1 }, resolve);
    });
    const roomCode = createRes.gameState.roomCode;

    await new Promise((resolve) => {
      client2.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode, session: session2 }, resolve);
    });

    // Disconnect client2
    client2.disconnect();

    // Reconnect a fresh socket client using the same guest session
    const reconnectedClient = Client(`http://localhost:${port}`, { transports: ['websocket'] });
    await new Promise<void>((resolve) => reconnectedClient.on('connect', resolve));

    const reconnectRes: any = await new Promise((resolve) => {
      reconnectedClient.emit(SOCKET_EVENTS.ROOM_RECONNECT, {
        roomCode,
        sessionId: session2.sessionId
      }, resolve);
    });

    expect(reconnectRes.success).toBe(true);
    expect(reconnectRes.player.nickname).toBe('GuestTycoon');
    expect(reconnectRes.player.isDisconnected).toBe(false);

    reconnectedClient.disconnect();
  });
});
