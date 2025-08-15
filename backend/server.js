const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/../frontend'));

// Хранилище данных
let users = [
  {
    id: "admin_1",
    username: "admin",
    email: "admin@admin.com",
    password: "admin123",
    balance: 1000000,
    isAdmin: true
  }
];

let gameState = {
  multiplier: 1.00,
  isRunning: false,
  bettingPhase: false,
  bets: [],
  history: []
};

let chatMessages = [];
let gameSettings = {
  crashProbability: 0.02,
  minMultiplier: 1.5,
  maxMultiplier: 20
};

let onlineUsers = new Set();

// API Routes
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = users.find(u => u.email === email || u.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = {
    id: 'user_' + Date.now().toString(),
    username,
    email,
    password,
    balance: 1000,
    isAdmin: false
  };

  users.push(user);

  res.status(201).json({
    token: user.id,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      isAdmin: user.isAdmin
    }
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  res.json({
    token: user.id,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      isAdmin: user.isAdmin
    }
  });
});

app.get('/api/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const user = users.find(u => u.id === token);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      isAdmin: user.isAdmin
    }
  });
});

app.post('/api/update-balance', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { amount } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const user = users.find(u => u.id === token);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.balance += amount;
  res.json({ balance: user.balance });
});

// Admin API
app.post('/api/admin/settings', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const user = users.find(u => u.id === token);

  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { crashProbability, minMultiplier, maxMultiplier } = req.body;

  if (crashProbability !== undefined) {
    gameSettings.crashProbability = Math.max(0.001, Math.min(0.1, crashProbability));
  }

  if (minMultiplier !== undefined) {
    gameSettings.minMultiplier = Math.max(1.1, minMultiplier);
  }

  if (maxMultiplier !== undefined) {
    gameSettings.maxMultiplier = Math.max(gameSettings.minMultiplier + 0.5, maxMultiplier);
  }

  res.json({ message: 'Settings updated', settings: gameSettings });
});

app.get('/api/admin/settings', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const user = users.find(u => u.id === token);

  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(gameSettings);
});

// Admin Users API
app.get('/api/admin/users', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const user = users.find(u => u.id === token);

  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Return users without passwords
  const usersWithoutPasswords = users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    balance: u.balance,
    isAdmin: u.isAdmin
  }));

  res.json(usersWithoutPasswords);
});

app.post('/api/admin/users', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const adminUser = users.find(u => u.id === token);

  if (!adminUser || !adminUser.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { username, email, password, balance } = req.body;

  const existingUser = users.find(u => u.email === email || u.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = {
    id: 'user_' + Date.now().toString(),
    username,
    email,
    password,
    balance: balance || 1000,
    isAdmin: false
  };

  users.push(user);

  res.status(201).json({
    message: 'User created',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      isAdmin: user.isAdmin
    }
  });
});

app.delete('/api/admin/users/:userId', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const adminUser = users.find(u => u.id === token);
  const userId = req.params.userId;

  if (!adminUser || !adminUser.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Prevent deleting admin users
  const userToDelete = users.find(u => u.id === userId);
  if (userToDelete && userToDelete.isAdmin) {
    return res.status(403).json({ message: 'Cannot delete admin users' });
  }

  users = users.filter(u => u.id !== userId);

  res.json({ message: 'User deleted' });
});

app.put('/api/admin/users/:userId/balance', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const adminUser = users.find(u => u.id === token);
  const userId = req.params.userId;
  const { amount } = req.body;

  if (!adminUser || !adminUser.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.balance += amount;

  res.json({
    message: 'Balance updated',
    balance: user.balance
  });

  // Notify user about balance update
  if (user.socketId) {
    io.to(user.socketId).emit('balanceUpdate', {
      userId: user.id,
      balance: user.balance
    });
  }
});

// Serve admin panel
app.get('/admin.html', (req, res) => {
  res.sendFile(__dirname + '/../frontend/admin.html');
});

// Socket.io connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('userOnline', (userId) => {
    onlineUsers.add(userId);
    io.emit('onlineCount', onlineUsers.size);
  });

  socket.on('disconnect', () => {
    for (let userId of onlineUsers) {
      const user = users.find(u => u.id === userId);
      if (user && user.socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('onlineCount', onlineUsers.size);
    console.log('User disconnected:', socket.id);
  });

  socket.emit('gameState', gameState);
  socket.emit('chatHistory', chatMessages);

  socket.on('getGameSettings', () => {
    const userId = socket.userId;
    const user = users.find(u => u.id === userId);
    if (user && user.isAdmin) {
      socket.emit('gameSettings', gameSettings);
    }
  });

  socket.on('getAllUsers', () => {
    const userId = socket.userId;
    const user = users.find(u => u.id === userId);
    if (user && user.isAdmin) {
      // Return users without passwords
      const usersWithoutPasswords = users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        balance: u.balance,
        isAdmin: u.isAdmin
      }));
      socket.emit('allUsers', usersWithoutPasswords);
    }
  });

  socket.on('placeBet', (betData) => {
    if (!gameState.bettingPhase) {
      socket.emit('error', 'Ставки принимаются только в течение фазы ставок');
      return;
    }

    const user = users.find(u => u.id === betData.userId);
    if (!user) {
      socket.emit('error', 'Пользователь не найден');
      return;
    }

    if (betData.amount > user.balance) {
      socket.emit('error', 'Недостаточно средств');
      return;
    }

    user.balance -= betData.amount;

    const bet = {
      ...betData,
      id: Date.now(),
      timestamp: new Date()
    };

    gameState.bets.push(bet);

    io.emit('newBet', bet);
    io.emit('updateBets', gameState.bets);
    io.emit('balanceUpdate', { userId: user.id, balance: user.balance });
  });

  socket.on('cashout', (data) => {
    const betIndex = gameState.bets.findIndex(bet =>
      bet.userId === data.userId && !bet.cashedOut
    );

    if (betIndex !== -1) {
      const bet = gameState.bets[betIndex];
      const user = users.find(u => u.id === bet.userId);

      if (user) {
        gameState.bets[betIndex].cashedOut = true;
        gameState.bets[betIndex].cashoutMultiplier = gameState.multiplier;

        const winnings = Math.floor(bet.amount * gameState.multiplier);
        user.balance += winnings;

        io.emit('betCashedOut', {
          betId: gameState.bets[betIndex].id,
          multiplier: gameState.multiplier,
          winnings: winnings,
          userId: user.id,
          username: user.username
        });

        io.emit('balanceUpdate', { userId: user.id, balance: user.balance });
        io.emit('updateBets', gameState.bets);
      }
    }
  });

  // Улучшенный автоматический кэшаут
  socket.on('setAutoCashout', (data) => {
    const betIndex = gameState.bets.findIndex(bet =>
      bet.userId === data.userId && !bet.cashedOut
    );

    if (betIndex !== -1) {
      gameState.bets[betIndex].autoCashout = data.targetMultiplier;
      io.emit('updateBets', gameState.bets);
    }
  });

  socket.on('sendMessage', (data) => {
    const user = users.find(u => u.id === data.userId);
    if (!user) return;

    const message = {
      id: Date.now(),
      userId: data.userId,
      username: user.username,
      message: data.message,
      timestamp: new Date()
    };

    chatMessages.push(message);

    if (chatMessages.length > 100) {
      chatMessages.shift();
    }

    io.emit('newMessage', message);
  });

  socket.on('authenticate', (token) => {
    const user = users.find(u => u.id === token);
    if (user) {
      socket.userId = user.id;
      socket.username = user.username;
      user.socketId = socket.id;
      onlineUsers.add(user.id);
      io.emit('onlineCount', onlineUsers.size);
      console.log('User authenticated:', user.username);
    }
  });

  // Admin socket events
  socket.on('forceGameStart', () => {
    const userId = socket.userId;
    const user = users.find(u => u.id === userId);
    if (user && user.isAdmin) {
      // Принудительный запуск игры
      if (!gameState.isRunning && !gameState.bettingPhase) {
        // Начинаем игру немедленно
        gameState.bettingPhase = false;
        gameState.isRunning = true;
        gameState.multiplier = 1.00;
        gameState.bets = [];

        io.emit('gameStarted', gameState);

        const crashPoint = Math.random() * (gameSettings.maxMultiplier - gameSettings.minMultiplier) + gameSettings.minMultiplier;

        const gameInterval = setInterval(() => {
          if (!gameState.isRunning) {
            clearInterval(gameInterval);
            return;
          }

          gameState.multiplier += 0.01;
          io.emit('multiplierUpdate', gameState.multiplier);

          // Проверяем автоматические кэшауты
          gameState.bets.forEach((bet, index) => {
            if (!bet.cashedOut && bet.autoCashout && gameState.multiplier >= bet.autoCashout) {
              const betUser = users.find(u => u.id === bet.userId);
              if (betUser) {
                bet.cashedOut = true;
                bet.cashoutMultiplier = gameState.multiplier;

                const winnings = Math.floor(bet.amount * bet.autoCashout);
                betUser.balance += winnings;

                io.emit('betCashedOut', {
                  betId: bet.id,
                  multiplier: bet.autoCashout,
                  winnings: winnings,
                  userId: betUser.id,
                  username: betUser.username,
                  auto: true,
                  targetMultiplier: bet.autoCashout
                });

                io.emit('balanceUpdate', { userId: betUser.id, balance: betUser.balance });
                io.emit('updateBets', gameState.bets);
              }
            }
          });

          if (gameState.multiplier >= crashPoint || Math.random() < gameSettings.crashProbability) {
            gameState.isRunning = false;

            // Все не закэшированные ставки проигрывают
            gameState.bets.forEach(bet => {
              if (!bet.cashedOut) {
                bet.lost = true;
              }
            });

            gameState.history.unshift({
              multiplier: gameState.multiplier,
              timestamp: new Date()
            });

            if (gameState.history.length > 50) {
              gameState.history.pop();
            }

            io.emit('gameCrashed', gameState.multiplier);
            io.emit('updateHistory', gameState.history);
            io.emit('updateBets', gameState.bets);

            clearInterval(gameInterval);
            setTimeout(startBettingPhase, 3000);
          }
        }, 50);

        io.emit('adminNotification', {
          message: 'Администратор запустил игру!',
          type: 'info'
        });
      }
    }
  });

  socket.on('forceGameCrash', () => {
    const userId = socket.userId;
    const user = users.find(u => u.id === userId);
    if (user && user.isAdmin) {
      // Принудительный краш игры
      if (gameState.isRunning) {
        gameState.isRunning = false;

        // Все не закэшированные ставки проигрывают
        gameState.bets.forEach(bet => {
          if (!bet.cashedOut) {
            bet.lost = true;
          }
        });

        gameState.history.unshift({
          multiplier: gameState.multiplier,
          timestamp: new Date()
        });

        if (gameState.history.length > 50) {
          gameState.history.pop();
        }

        io.emit('gameCrashed', gameState.multiplier);
        io.emit('updateHistory', gameState.history);
        io.emit('updateBets', gameState.bets);

        io.emit('adminNotification', {
          message: 'Администратор остановил игру!',
          type: 'info'
        });
        setTimeout(startBettingPhase, 3000);
      }
    }
  });

  socket.on('sendAdminMessage', (data) => {
    const userId = socket.userId;
    const user = users.find(u => u.id === userId);
    if (user && user.isAdmin) {
      // Отправка сообщения всем пользователям
      const message = {
        id: Date.now(),
        userId: 'admin',
        username: '👑 Администратор',
        message: data.message,
        timestamp: new Date()
      };

      chatMessages.push(message);
      if (chatMessages.length > 100) {
        chatMessages.shift();
      }

      io.emit('newMessage', message);
      io.emit('adminNotification', {
        message: 'Сообщение отправлено всем пользователям',
        type: 'success'
      });
    }
  });
});

// Game logic
function startBettingPhase() {
  gameState.bettingPhase = true;
  gameState.bets = [];

  io.emit('bettingPhaseStarted', {
    timeUntilStart: 10000
  });

  let timeLeft = 10000;
  const countdownInterval = setInterval(() => {
    timeLeft -= 1000;
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      startGame();
    } else {
      io.emit('bettingCountdown', timeLeft);
    }
  }, 1000);
}

function startGame() {
  gameState.bettingPhase = false;
  gameState.isRunning = true;
  gameState.multiplier = 1.00;

  io.emit('gameStarted', {
    ...gameState,
    betsInfo: gameState.bets.map(bet => ({
      username: bet.username,
      amount: bet.amount,
      targetMultiplier: bet.targetMultiplier
    }))
  });

  const crashPoint = Math.random() * (gameSettings.maxMultiplier - gameSettings.minMultiplier) + gameSettings.minMultiplier;

  const gameInterval = setInterval(() => {
    if (!gameState.isRunning) {
      clearInterval(gameInterval);
      return;
    }

    gameState.multiplier += 0.01;
    io.emit('multiplierUpdate', gameState.multiplier);

    // Проверяем автоматические кэшауты
    checkAutoCashouts();

    if (gameState.multiplier >= crashPoint || Math.random() < gameSettings.crashProbability) {
      gameState.isRunning = false;

      // Все не закэшированные ставки проигрывают
      gameState.bets.forEach(bet => {
        if (!bet.cashedOut) {
          bet.lost = true;
        }
      });

      gameState.history.unshift({
        multiplier: gameState.multiplier,
        timestamp: new Date()
      });

      if (gameState.history.length > 50) {
        gameState.history.pop();
      }

      io.emit('gameCrashed', gameState.multiplier);
      io.emit('updateHistory', gameState.history);
      io.emit('updateBets', gameState.bets);

      clearInterval(gameInterval);
      setTimeout(startBettingPhase, 3000);
    }
  }, 50);
}

function checkAutoCashouts() {
  gameState.bets.forEach((bet, index) => {
    if (!bet.cashedOut && bet.autoCashout && gameState.multiplier >= bet.autoCashout) {
      const user = users.find(u => u.id === bet.userId);
      if (user) {
        bet.cashedOut = true;
        bet.cashoutMultiplier = gameState.multiplier;

        const winnings = Math.floor(bet.amount * bet.autoCashout); // Выигрыш по целевому коэффициенту
        user.balance += winnings;

        io.emit('betCashedOut', {
          betId: bet.id,
          multiplier: bet.autoCashout, // Используем целевой коэффициент
          winnings: winnings,
          userId: user.id,
          username: user.username,
          auto: true,
          targetMultiplier: bet.autoCashout
        });

        io.emit('balanceUpdate', { userId: user.id, balance: user.balance });
        io.emit('updateBets', gameState.bets);
      }
    }
  });
}

setTimeout(startBettingPhase, 2000);

const PORT = 3003;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is busy, trying ${PORT + 1}`);
    setTimeout(() => {
      server.listen(PORT + 1, () => {
        console.log(`Server running on port ${PORT + 1}`);
      });
    }, 1000);
  } else {
    console.error(err);
  }
});