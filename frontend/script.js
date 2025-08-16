//script.js
class CasinoRocket {
    constructor() {
        // Инициализация Socket.IO соединения
        this.socket = io();
        // Данные пользователя и игры
        this.user = null; // Текущий авторизованный пользователь
        this.currentBet = null; // Текущая ставка пользователя
        this.isGameRunning = false; // Флаг состояния игры (запущена/остановлена)
        this.isBettingPhase = false; // Флаг фазы ставок (можно/нельзя делать ставки)
        this.multiplier = 1.00; // Текущий множитель
        this.timeUntilStart = 0; // Время до начала следующей игры
        this.allUsers = []; // Все пользователи (для админ панели)
        // Инициализация всех элементов интерфейса
        this.initElements();
        // Инициализация обработчиков событий
        this.initEventListeners();
        // Инициализация обработчиков Socket.IO
        this.initSocketListeners();
        // Проверка авторизации при загрузке
        this.checkAuth();
        // Инициализация мобильных функций
        this.initMobileFeatures();
    }
    // Инициализация всех DOM элементов
    initElements() {
        // Auth elements - элементы аутентификации
        this.authModal = document.getElementById('authModal');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        // Admin elements - элементы администратора
        this.adminModal = document.getElementById('adminModal');
        this.adminSettingsForm = document.getElementById('adminSettingsForm');
        this.adminSettingsBtn = document.getElementById('adminSettingsBtn');
        this.adminSettingsBtnMobile = document.getElementById('adminSettingsBtnMobile');
        this.closeAdminModal = document.getElementById('closeAdminModal');
        // Game elements - основные игровые элементы
        this.gameContainer = document.getElementById('gameContainer');
        this.usernameEl = document.getElementById('username');
        this.balanceEl = document.getElementById('balance');
        this.usernameMobile = document.getElementById('usernameMobile');
        this.balanceMobile = document.getElementById('balanceMobile');
        this.onlineCountEl = document.getElementById('onlineCount');
        this.onlineCountMobile = document.getElementById('onlineCountMobile');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.logoutBtnMobile = document.getElementById('logoutBtnMobile');
        this.rocket = document.getElementById('rocket');
        // НОВЫЙ ЭЛЕМЕНТ ДЛЯ ОТОБРАЖЕНИЯ СОСТОЯНИЯ ИГРЫ
        this.gameStatus = document.getElementById('gameStatus');
        this.betAmount = document.getElementById('betAmount');
        this.targetMultiplier = document.getElementById('targetMultiplier');
        this.placeBetBtn = document.querySelector('#placeBetBtn');
        this.cashoutBtn = document.querySelector('#cashoutBtn');
        // Кнопки пополнения баланса
        this.rechargeBtn = document.getElementById('rechargeBtn');
        this.rechargeBtnMobile = document.getElementById('rechargeBtnMobile');
        // Элементы для отображения ставок
        this.myBetsList = document.getElementById('myBetsList'); // Мои ставки (десктоп)
        this.allBetsList = document.getElementById('allBetsList'); // Все ставки (десктоп)
        this.myBetsListMobile = document.getElementById('myBetsListMobile'); // Мои ставки (мобильные)
        this.allBetsListMobile = document.getElementById('allBetsListMobile'); // Все ставки (мобильные)
        this.betsToggleBtns = document.querySelectorAll('.bets-toggle-btn'); // Кнопки переключения ставок (мобильные)
        this.historyList = document.getElementById('historyList');
        this.historyListMobile = document.getElementById('historyListMobile');
        // Quick bet buttons - кнопки быстрых ставок
        this.quickBetBtns = document.querySelectorAll('.quick-bet-btn-1win');
        // Betting timers - таймеры ставок
        this.bettingTimer = document.getElementById('bettingTimer');
        this.bettingTimerDesktop = document.getElementById('bettingTimerDesktop');
        // Chat elements - элементы чата
        this.chatMessages = document.getElementById('chatMessages');
        this.chatMessagesMobile = document.getElementById('chatMessagesMobile');
        this.chatInput = document.getElementById('chatInput');
        this.chatInputMobile = document.getElementById('chatInputMobile');
        this.sendChatBtn = document.getElementById('sendChatBtn');
        this.sendChatBtnMobile = document.getElementById('sendChatBtnMobile');
        // Mobile elements - мобильные элементы
        this.mobileMenu = document.getElementById('mobileMenu');
        this.menuToggle = document.getElementById('menuToggle');
        this.closeMenu = document.getElementById('closeMenu');
        this.mobileTabs = document.querySelectorAll('.mobile-tab');
        this.mobileTabPanes = document.querySelectorAll('.mobile-tab-pane');
    }
    // Инициализация обработчиков событий
    initEventListeners() {
        // Auth tabs - переключение между вкладками входа/регистрации
        if (this.tabBtns) {
            this.tabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.switchTab(e.target.dataset.tab);
                });
            });
        }
        // Auth forms - обработка форм входа и регистрации
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.register();
            });
        }

        // Recharge buttons - кнопки пополнения баланса
        if (this.rechargeBtn) {
            this.rechargeBtn.addEventListener('click', () => this.rechargeBalance());
        }
        if (this.rechargeBtnMobile) {
            this.rechargeBtnMobile.addEventListener('click', () => this.rechargeBalance());
        }
        // Quick bet buttons - обработка быстрых ставок
        if (this.quickBetBtns) {
            this.quickBetBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const amount = parseInt(e.target.dataset.amount);
                    this.addQuickBet(amount);
                });
            });
        }
        // Game controls - игровое управление
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }
        if (this.logoutBtnMobile) {
            this.logoutBtnMobile.addEventListener('click', () => this.logout());
        }
        if (this.placeBetBtn) {
            this.placeBetBtn.addEventListener('click', () => this.placeBet());
        }
        if (this.cashoutBtn) {
            this.cashoutBtn.addEventListener('click', () => this.cashout());
        }
        // Chat - обработка чата
        if (this.sendChatBtn) {
            this.sendChatBtn.addEventListener('click', () => this.sendMessage());
        }
        if (this.sendChatBtnMobile) {
            this.sendChatBtnMobile.addEventListener('click', () => this.sendMessage());
        }
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
        if (this.chatInputMobile) {
            this.chatInputMobile.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
        // Mobile menu - мобильное меню
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => {
                if (this.mobileMenu) {
                    this.mobileMenu.style.display = 'block';
                }
            });
        }
        if (this.closeMenu) {
            this.closeMenu.addEventListener('click', () => {
                if (this.mobileMenu) {
                    this.mobileMenu.style.display = 'none';
                }
            });
        }
        // Mobile bets toggle - переключение между своими и всеми ставками на мобильных
        if (this.betsToggleBtns) {
            this.betsToggleBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.switchBetsView(e.target.dataset.betType);
                });
            });
        }
        // Mobile tabs - мобильные вкладки
        if (this.mobileTabs) {
            this.mobileTabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    this.switchMobileTab(e.target.dataset.tab);
                });
            });
        }
        // Close modals when clicking outside - закрытие модальных окон по клику вне их
        if (this.authModal) {
            this.authModal.addEventListener('click', (e) => {
                if (e.target === this.authModal) {
                    this.authModal.style.display = 'none';
                }
            });
        }
        if (this.adminModal) {
            this.adminModal.addEventListener('click', (e) => {
                if (e.target === this.adminModal) {
                    this.adminModal.style.display = 'none';
                }
            });
        }
        if (this.mobileMenu) {
            this.mobileMenu.addEventListener('click', (e) => {
                if (e.target === this.mobileMenu) {
                    this.mobileMenu.style.display = 'none';
                }
            });
        }
    }
    // Инициализация мобильных функций
    initMobileFeatures() {
        // Handle window resize - обработка изменения размера окна
        window.addEventListener('resize', () => {
            this.updateLayout();
        });
        // Handle orientation change - обработка изменения ориентации
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateLayout();
            }, 100);
        });
        // Prevent zoom on input focus - предотвращение зума при фокусе на input
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.style.fontSize = '16px';
            });
            input.addEventListener('blur', () => {
                input.style.fontSize = '';
            });
        });
    }
    // Обновление лэйаута при изменении размера экрана
    updateLayout() {
        // Update layout based on screen size
        const isMobile = window.innerWidth < 769;
        if (isMobile) {
            // Mobile specific updates
            if (this.bettingTimer) {
                this.bettingTimer.style.display = 'none';
            }
            if (this.bettingTimerDesktop) {
                this.bettingTimerDesktop.style.display = 'none';
            }
        } else {
            // Desktop specific updates
            this.updateBettingTimer();
        }
    }
    // Инициализация обработчиков Socket.IO событий
    initSocketListeners() {
        // Получение состояния игры при подключении
        this.socket.on('gameState', (state) => {
            this.isGameRunning = state.isRunning || false;
            this.isBettingPhase = state.bettingPhase || false;
            this.multiplier = state.multiplier || 1.00;
            this.timeUntilStart = state.timeUntilStart || 0;
            this.updateBets(state.bets || []);
            this.updateHistory(state.history || []);
            this.updatePlaceBetButton();
            if (state.bettingPhase) {
                this.showBettingTimer();
            }
            // Обновляем статус игры при подключении
            this.updateGameStatus();
        });
        // Начало фазы ставок
        this.socket.on('bettingPhaseStarted', (data) => {
            this.isBettingPhase = true;
            this.isGameRunning = false;
            this.timeUntilStart = data.timeUntilStart || 10000;
            this.multiplier = 1.00;
            this.currentBet = null;
            if (this.cashoutBtn) {
                this.cashoutBtn.disabled = true;
            }
            this.showPrestartRocket();
            this.showBettingTimer();
            this.updatePlaceBetButton();
            this.clearBets();
            // Обновляем статус игры
            this.updateGameStatus();
        });
        // Обратный отсчет до начала игры
        this.socket.on('bettingCountdown', (timeLeft) => {
            this.timeUntilStart = timeLeft;
            this.updateBettingTimer();
            // Обновляем статус игры во время обратного отсчета
            this.updateGameStatus();
        });
        // Начало игры
        this.socket.on('gameStarted', (state) => {
            this.isBettingPhase = false;
            this.isGameRunning = true;
            this.multiplier = 1.00;
            this.startRocketAnimation();
            this.updateBets(state.bets || []);
            this.updatePlaceBetButton();
            // Обновляем статус игры
            this.updateGameStatus();
        });
        // Обновление множителя во время игры
        this.socket.on('multiplierUpdate', (multiplier) => {
            this.multiplier = multiplier;
            this.updateRocketPosition(multiplier);
            this.updateBetsDisplay();
            // Обновляем статус игры во время игры
            this.updateGameStatus();
        });
        // Игра завершена (краш)
        this.socket.on('gameCrashed', (multiplier) => {
            this.isGameRunning = false;
            this.crashRocket(multiplier); // Передаем множитель краша
            this.currentBet = null;
            if (this.cashoutBtn) {
                this.cashoutBtn.disabled = true;
            }
            this.updatePlaceBetButton();
            // Обновляем статус игры при краше
            this.updateGameStatus(multiplier);
        });
        // Новая ставка от любого пользователя
        this.socket.on('newBet', (bet) => {
            this.addBetToList(bet);
        });
        // Обновление всех ставок
        this.socket.on('updateBets', (bets) => {
            this.updateBets(bets);
        });
        // Обновление истории игр
        this.socket.on('updateHistory', (history) => {
            this.updateHistory(history);
        });
        // Ставка закэширована
        this.socket.on('betCashedOut', (data) => {
            this.updateBetCashedOut(data);
        });
        // Обновление баланса пользователя
        this.socket.on('balanceUpdate', (data) => {
            if (this.user && this.user.id === data.userId) {
                this.user.balance = data.balance;
                this.updateUserInfo();
            }
        });
        // Ошибки
        this.socket.on('error', (message) => {
            this.showNotification(message, 'error');
        });
        // Chat - чат функциональность
        this.socket.on('chatHistory', (messages) => {
            this.updateChat(messages);
        });
        this.socket.on('newMessage', (message) => {
            this.addMessageToChat(message);
        });
        // Online count - количество онлайн пользователей
        this.socket.on('onlineCount', (count) => {
            if (this.onlineCountEl) {
                this.onlineCountEl.textContent = count;
            }
            if (this.onlineCountMobile) {
                this.onlineCountMobile.textContent = count;
            }
        });
        // Admin - админ настройки
        this.socket.on('gameSettings', (settings) => {
            if (document.getElementById('crashProbability')) {
                document.getElementById('crashProbability').value = settings.crashProbability;
                document.getElementById('minMultiplier').value = settings.minMultiplier;
                document.getElementById('maxMultiplier').value = settings.maxMultiplier;
            }
        });
    }
    // Показ уведомлений
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        // Add to body
        document.body.appendChild(notification);
        // Remove after delay
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    // Добавление быстрой ставки
    addQuickBet(amount) {
        if (this.betAmount) {
            const currentAmount = parseInt(this.betAmount.value) || 0;
            this.betAmount.value = currentAmount + amount;
            // Add animation
            this.betAmount.style.transform = 'scale(1.1)';
            setTimeout(() => {
                if (this.betAmount) {
                    this.betAmount.style.transform = 'scale(1)';
                }
            }, 200);
        }
    }
    // Показ таймера ставок
    showBettingTimer() {
        const isMobile = window.innerWidth < 769;
        if (isMobile) {
            if (this.bettingTimerDesktop) {
                this.bettingTimerDesktop.style.display = 'block';
                this.updateBettingTimer();
            }
        } else {
            if (this.bettingTimer) {
                this.bettingTimer.style.display = 'block';
                this.bettingTimerDesktop.style.display = 'block';
                this.updateBettingTimer();
            }
        }
    }
    // Скрытие таймера ставок
    hideBettingTimer() {
        if (this.bettingTimer) {
            this.bettingTimer.style.display = 'none';
        }
        if (this.bettingTimerDesktop) {
            this.bettingTimerDesktop.style.display = 'none';
        }
    }
    // Обновление таймера ставок
    updateBettingTimer() {
        const seconds = Math.ceil(this.timeUntilStart / 1000);
        const timerText = `⏳ ${seconds}с`;
        if (this.bettingTimer) {
            this.bettingTimer.textContent = timerText;
        }
        if (this.bettingTimerDesktop) {
            this.bettingTimerDesktop.textContent = timerText;
        }
    }
    // НОВАЯ ФУНКЦИЯ: Обновление статуса игры
    updateGameStatus(crashMultiplier = null) {
        if (!this.gameStatus) return;

        if (this.isBettingPhase) {
            // Фаза ставок: показываем обратный отсчет
            const seconds = Math.ceil(this.timeUntilStart / 1000);
            this.gameStatus.innerHTML = `<div class="game-status-text">Ожидание следующего раунда</div><div class="game-status-timer">⏳ ${seconds}с</div>`;
            this.gameStatus.style.display = 'block';
        } else if (this.isGameRunning) {
            // Фаза игры: показываем множитель
            this.gameStatus.innerHTML = `<div class="game-status-multiplier">x${this.multiplier.toFixed(2)}</div>`;
            this.gameStatus.style.display = 'block';
        } else if (crashMultiplier !== null) {
            // Краш: показываем множитель краша и текст "Улетел"
            this.gameStatus.innerHTML = `<div class="game-status-crash">x${crashMultiplier.toFixed(2)}<br><span class="crash-text">Улетел</span></div>`;
            this.gameStatus.style.display = 'block';
        } else {
            // Фаза ожидания: скрываем статус
            this.gameStatus.style.display = 'none';
        }
    }
    // Переключение вкладок аутентификации
    switchTab(tab) {
        if (this.tabBtns) {
            this.tabBtns.forEach(btn => btn.classList.remove('active'));
        }
        const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        if (tab === 'login') {
            if (this.loginForm) this.loginForm.style.display = 'flex';
            if (this.registerForm) this.registerForm.style.display = 'none';
        } else {
            if (this.loginForm) this.loginForm.style.display = 'none';
            if (this.registerForm) this.registerForm.style.display = 'flex';
        }
    }
    // Переключение мобильных вкладок
    switchMobileTab(tab) {
        // Update active tab
        if (this.mobileTabs) {
            this.mobileTabs.forEach(tabBtn => {
                tabBtn.classList.remove('active');
            });
        }
        const activeTab = document.querySelector(`[data-tab="${tab}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        // Show active pane
        if (this.mobileTabPanes) {
            this.mobileTabPanes.forEach(pane => {
                pane.classList.remove('active');
            });
        }
        const activePane = document.getElementById(`${tab}Tab`);
        if (activePane) {
            activePane.classList.add('active');
        }
    }
    // Переключение между своими и всеми ставками (мобильные)
    switchBetsView(type) {
        if (this.betsToggleBtns) {
            this.betsToggleBtns.forEach(btn => btn.classList.remove('active'));
        }
        const activeBtn = document.querySelector(`[data-bet-type="${type}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        if (this.myBetsListMobile && this.allBetsListMobile) {
            if (type === 'my') {
                this.myBetsListMobile.style.display = 'block';
                this.allBetsListMobile.style.display = 'none';
            } else {
                this.myBetsListMobile.style.display = 'none';
                this.allBetsListMobile.style.display = 'block';
            }
        }
    }
    // Вход пользователя
    async login() {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        if (!emailInput || !passwordInput) return;
        const email = emailInput.value;
        const password = passwordInput.value;
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                this.user = data.user;
                this.socket.emit('authenticate', data.token);
                this.socket.emit('userOnline', data.user.id);
                this.showGame();
                this.updateUserInfo();
                this.updateAdminButton();
                // Close mobile menu
                if (this.mobileMenu) {
                    this.mobileMenu.style.display = 'none';
                }
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка при входе', 'error');
        }
    }
    // Регистрация пользователя
    async register() {
        const usernameInput = document.getElementById('registerUsername');
        const emailInput = document.getElementById('registerEmail');
        const passwordInput = document.getElementById('registerPassword');
        if (!usernameInput || !emailInput || !passwordInput) return;
        const username = usernameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                this.user = data.user;
                this.socket.emit('authenticate', data.token);
                this.socket.emit('userOnline', data.user.id);
                this.showGame();
                this.updateUserInfo();
                this.updateAdminButton();
                // Close mobile menu
                if (this.mobileMenu) {
                    this.mobileMenu.style.display = 'none';
                }
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка при регистрации', 'error');
        }
    }
    // Проверка авторизации при загрузке страницы
    async checkAuth() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch('/api/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    this.user = data.user;
                    this.socket.emit('authenticate', token);
                    this.socket.emit('userOnline', data.user.id);
                    this.showGame();
                    this.updateUserInfo();
                    this.updateAdminButton();
                } else {
                    this.showAuth();
                }
            } catch (error) {
                this.showAuth();
            }
        } else {
            this.showAuth();
        }
    }
    // Показ формы авторизации
    showAuth() {
        if (this.authModal) this.authModal.style.display = 'flex';
        if (this.gameContainer) this.gameContainer.style.display = 'none';
        this.hideAdminSettings();
        // Close mobile menu
        if (this.mobileMenu) {
            this.mobileMenu.style.display = 'none';
        }
    }
    // Показ игрового интерфейса
    showGame() {
        if (this.authModal) this.authModal.style.display = 'none';
        if (this.gameContainer) this.gameContainer.style.display = 'block';
        this.hideAdminSettings();
    }
    // Обновление информации о пользователе
    updateUserInfo() {
        if (this.user) {
            const userInfo = `${this.user.username} | 💰${this.user.balance}`;
            if (this.usernameEl && this.balanceEl) {
                this.usernameEl.textContent = this.user.username;
                this.balanceEl.textContent = `💰 ${this.user.balance}`;
            }
            if (this.usernameMobile && this.balanceMobile) {
                this.usernameMobile.textContent = this.user.username;
                this.balanceMobile.textContent = `💰${this.user.balance}`;
            }
        }
    }
    // Обновление кнопки администратора
    updateAdminButton() {
        const isAdmin = this.user && this.user.isAdmin;
        if (this.adminSettingsBtn) {
            this.adminSettingsBtn.style.display = isAdmin ? 'block' : 'none';
        }
        if (this.adminSettingsBtnMobile) {
            this.adminSettingsBtnMobile.style.display = isAdmin ? 'flex' : 'none';
        }
    }
    // Показ настроек администратора
    showAdminSettings() {
        if (this.adminModal) this.adminModal.style.display = 'flex';
        this.socket.emit('getGameSettings');
        // Close mobile menu
        if (this.mobileMenu) {
            this.mobileMenu.style.display = 'none';
        }
    }
    // Скрытие настроек администратора
    hideAdminSettings() {
        if (this.adminModal) this.adminModal.style.display = 'none';
    }
    // Пополнение баланса
    rechargeBalance() {
        // Перенаправление на страницу пополнения
        window.location.href = '/payment.html';
    }
    // Сохранение настроек администратора
    async saveAdminSettings() {
        const crashInput = document.getElementById('crashProbability');
        const minInput = document.getElementById('minMultiplier');
        const maxInput = document.getElementById('maxMultiplier');
        if (!crashInput || !minInput || !maxInput) return;
        const crashProbability = parseFloat(crashInput.value);
        const minMultiplier = parseFloat(minInput.value);
        const maxMultiplier = parseFloat(maxInput.value);
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ crashProbability, minMultiplier, maxMultiplier })
            });
            const data = await response.json();
            if (response.ok) {
                this.showNotification('Настройки сохранены', 'success');
                this.hideAdminSettings();
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка при сохранении настроек', 'error');
        }
    }
    // Выход пользователя
    async logout() {
        localStorage.removeItem('token');
        this.user = null;
        this.showAuth();
        // Close mobile menu
        if (this.mobileMenu) {
            this.mobileMenu.style.display = 'none';
        }
    }
    // Обновление кнопки ставки
    updatePlaceBetButton() {
        if (!this.placeBetBtn) return;
        if (this.isBettingPhase) {
            this.placeBetBtn.disabled = false;
            this.placeBetBtn.textContent = '🚀 Сделать ставку';
            this.placeBetBtn.className = 'place-bet-btn-1win btn-success-1win';
        } else if (this.isGameRunning) {
            this.placeBetBtn.disabled = true;
            this.placeBetBtn.textContent = '🎮 Игра началась';
            this.placeBetBtn.className = 'place-bet-btn-1win btn-warning-1win';
        } else {
            this.placeBetBtn.disabled = true;
            this.placeBetBtn.textContent = '⏳ Ожидание ставок';
            this.placeBetBtn.className = 'place-bet-btn-1win btn-secondary-1win';
        }
    }
    // Размещение ставки
    async placeBet() {
        if (!this.user || !this.isBettingPhase || !this.betAmount) return;
        const amount = parseInt(this.betAmount.value);
        const targetMultiplier = parseFloat(this.targetMultiplier.value) || 2.0;
        if (!amount || amount <= 0) {
            this.showNotification('Введите корректную сумму ставки', 'error');
            return;
        }
        if (amount > this.user.balance) {
            this.showNotification('Недостаточно средств', 'error');
            return;
        }
        if (targetMultiplier < 1.1) {
            this.showNotification('Минимальный множитель: 1.1x', 'error');
            return;
        }
        // Place bet via socket
        this.socket.emit('placeBet', {
            userId: this.user.id,
            username: this.user.username,
            amount: amount,
            multiplier: 1.00,
            autoCashout: targetMultiplier
        });
        this.currentBet = {
            amount: amount,
            targetMultiplier: targetMultiplier
        };
        if (this.cashoutBtn) {
            this.cashoutBtn.disabled = false;
        }
        this.updatePlaceBetButton();
        // Анимация кнопки
        if (this.placeBetBtn) {
            this.placeBetBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                if (this.placeBetBtn) {
                    this.placeBetBtn.style.transform = 'scale(1)';
                }
            }, 100);
        }
        // Не очищаем поле суммы ставки после нажатия (по вашему требованию)
        // this.betAmount.value = '';
    }
    // Забрать выигрыш
    cashout() {
        if (!this.currentBet || !this.isGameRunning) return;
        this.socket.emit('cashout', {
            userId: this.user.id,
            multiplier: this.multiplier
        });
        this.currentBet = null;
        if (this.cashoutBtn) {
            this.cashoutBtn.disabled = true;
        }
        // Анимация кнопки
        if (this.cashoutBtn) {
            this.cashoutBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                if (this.cashoutBtn) {
                    this.cashoutBtn.style.transform = 'scale(1)';
                }
            }, 100);
        }
    }
    // Запуск анимации ракеты
    startRocketAnimation() {
        if (this.rocket) {
            this.rocket.innerHTML = '<img src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/7a702f0aec3a535e1ba54a71c31bdfd1.webp" alt="Rocket">';
            this.rocket.style.bottom = '0';
            this.rocket.classList.remove('rocket-crash');
            this.rocket.classList.remove('rocket-prestart');
            this.rocket.style.transition = 'bottom 0.1s linear';
        }
        this.hideBettingTimer();
    }
    // Показ предстартовой ракеты
    showPrestartRocket() {
        if (this.rocket) {
            this.rocket.innerHTML = '<img src="https://1play.gamedev-tech.cc/lucky_grm/assets/media/c544881eb170e73349e4c92d1706a96c.svg" alt="Rocket Ready">';
            this.rocket.classList.add('rocket-prestart');
            this.rocket.style.bottom = '0';
            this.rocket.style.filter = 'drop-shadow(0 0 15px #00ff00)';
        }
    }
    // Обновление позиции ракеты
    updateRocketPosition(multiplier) {
        if (this.rocket) {
            const maxHeight = window.innerWidth < 769 ? 200 : 350;
            const position = Math.min(maxHeight * (multiplier / 15), maxHeight);
            this.rocket.style.bottom = position + 'px';
            // Удаляем анимацию при движении
            this.rocket.style.animation = 'none';
            if (multiplier > 5) {
                this.rocket.style.filter = 'drop-shadow(0 0 20px #ff5722)';
            } else if (multiplier > 2) {
                this.rocket.style.filter = 'drop-shadow(0 0 15px #ffeb3b)';
            } else {
                this.rocket.style.filter = 'drop-shadow(0 0 10px #00ffff)';
            }
        }
    }
    // Анимация краша ракеты (обновленная)
    crashRocket(crashMultiplier) {
        if (this.rocket) {
            this.rocket.classList.add('rocket-crash');
            this.rocket.style.filter = 'drop-shadow(0 0 30px #ff0000)';
        }
        this.hideBettingTimer();
        // Скрываем ракету и показываем статус краша
        setTimeout(() => {
            if (this.rocket) {
                this.rocket.style.display = 'none'; // Скрываем ракету
            }
            // Обновляем статус игры с множителем краша
            this.updateGameStatus(crashMultiplier);
        }, 500); // Небольшая задержка для анимации краша

        // Через 7 секунд возвращаем ракету и скрываем статус краша
        setTimeout(() => {
            if (this.rocket) {
                this.rocket.style.display = 'block'; // Показываем ракету
                this.rocket.style.bottom = '0';
                this.rocket.style.filter = 'none';
                this.rocket.classList.remove('rocket-crash');
                this.rocket.classList.add('rocket-prestart');
            }
            if (this.gameStatus) {
                this.gameStatus.style.display = 'none'; // Скрываем статус краша
            }
            if (this.cashoutBtn) {
                this.cashoutBtn.disabled = true;
            }
            this.updatePlaceBetButton();
        }, 7000); // 7 секунд ожидания
    }
    // Обновление всех ставок
    updateBets(bets) {
        if (!this.user) return;
        // Разделяем ставки на свои и чужие
        const myBets = bets.filter(bet => bet.userId === this.user.id);
        const otherBets = bets.filter(bet => bet.userId !== this.user.id);
        // Обновляем десктопные списки
        this.updateBetsList(myBets, this.myBetsList);
        this.updateBetsList(otherBets, this.allBetsList);
        // Обновляем мобильные списки
        this.updateBetsList(myBets, this.myBetsListMobile);
        this.updateBetsList(otherBets, this.allBetsListMobile);
    }
    // Обновление списка ставок
    updateBetsList(bets, container) {
        if (!container) return;
        container.innerHTML = '';
        // Сортируем ставки: активные сверху, закэшированные и проигравшие внизу
        const activeBets = bets.filter(bet => !bet.cashedOut && !bet.lost);
        const finishedBets = bets.filter(bet => bet.cashedOut || bet.lost);
        // Отображаем активные ставки первыми
        activeBets.forEach(bet => this.addBetToContainer(bet, container));
        // Отображаем завершенные ставки
        finishedBets.forEach(bet => this.addBetToContainer(bet, container));
    }
    // Добавление одной ставки в список
    addBetToList(bet) {
        // Добавляем в десктопные списки
        if (this.user && bet.userId === this.user.id) {
            this.addBetToContainer(bet, this.myBetsList);
            this.addBetToContainer(bet, this.myBetsListMobile);
        } else {
            this.addBetToContainer(bet, this.allBetsList);
            this.addBetToContainer(bet, this.allBetsListMobile);
        }
    }
    // Добавление ставки в контейнер
    addBetToContainer(bet, container) {
        if (!container) return;
        const betItem = document.createElement('div');
        betItem.className = 'bet-item fade-in';
        if (bet.cashedOut) {
            betItem.classList.add('winner');
        } else if (bet.lost) {
            betItem.classList.add('loser');
        }
        let resultHtml = '';
        if (bet.cashedOut) {
            resultHtml = `<span class="bet-result cashed-out">✅ ${(bet.cashoutMultiplier || 0).toFixed(2)}x</span>`;
        } else if (bet.lost) {
            resultHtml = `<span class="bet-result lost">❌ Проиграл</span>`;
        } else {
            resultHtml = `<span class="bet-result waiting">⏳ В игре</span>`;
        }
        betItem.innerHTML = `
            <div class="bet-info">
                <span class="bet-username">${bet.username || 'Аноним'}</span>
                <span class="bet-amount">💰 ${bet.amount || 0}</span>
            </div>
            <div class="bet-multiplier-info">
                ${bet.autoCashout ? `<span class="bet-target-multiplier">🎯 ${bet.autoCashout.toFixed(1)}x</span>` : ''}
                ${!bet.cashedOut && !bet.lost ? `<span class="bet-current-multiplier">${this.multiplier.toFixed(2)}x</span>` : ''}
                ${resultHtml}
            </div>
        `;
        container.appendChild(betItem);
    }
    // Очистка всех списков ставок
    clearBets() {
        // Очищаем все списки ставок
        if (this.myBetsList) this.myBetsList.innerHTML = '';
        if (this.allBetsList) this.allBetsList.innerHTML = '';
        if (this.myBetsListMobile) this.myBetsListMobile.innerHTML = '';
        if (this.allBetsListMobile) this.allBetsListMobile.innerHTML = '';
    }
    // Обновление отображения ставок во время игры
    updateBetsDisplay() {
        if (!this.isGameRunning) return;
        // Update current multipliers in all bet lists
        const betItems = document.querySelectorAll('.bet-item:not(.winner):not(.loser) .bet-current-multiplier');
        betItems.forEach(item => {
            item.textContent = this.multiplier.toFixed(2) + 'x';
        });
    }
    // Обновление информации о закэшированной ставке
    updateBetCashedOut(data) {
        // Обновляем UI для закэшированной ставки
        if (data.auto && data.targetMultiplier) {
            this.showNotification(`Авто кэш! ${data.username} выиграл ${(data.winnings || 0)} при ${data.targetMultiplier}x`, 'success');
        }
    }
    // Обновление истории игр
    updateHistory(history) {
        this.updateHistoryList(history, this.historyList);
        this.updateHistoryList(history, this.historyListMobile);
    }
    // Обновление списка истории
    updateHistoryList(history, container) {
        if (!container) return;
        container.innerHTML = '';
        history.slice(0, 20).forEach(game => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item fade-in';
            const multiplier = game.multiplier || 0;
            if (multiplier >= 5) {
                historyItem.className += ' win';
            } else if (multiplier >= 2) {
                historyItem.className += ' win';
            } else {
                historyItem.className += ' crash';
            }
            historyItem.textContent = multiplier.toFixed(2) + 'x';
            container.appendChild(historyItem);
        });
    }
    // Обновление чата
    updateChat(messages) {
        this.updateChatMessages(messages, this.chatMessages);
        this.updateChatMessages(messages, this.chatMessagesMobile);
    }
    // Обновление сообщений в чате
    updateChatMessages(messages, container) {
        if (!container) return;
        container.innerHTML = '';
        messages.forEach(message => this.addMessageToContainer(message, container));
        container.scrollTop = container.scrollHeight;
    }
    // Добавление сообщения в чат
    addMessageToChat(message) {
        this.addMessageToContainer(message, this.chatMessages);
        this.addMessageToContainer(message, this.chatMessagesMobile);
        this.scrollToBottom(this.chatMessages);
        this.scrollToBottom(this.chatMessagesMobile);
    }
    // Добавление сообщения в контейнер
    addMessageToContainer(message, container) {
        if (!container) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message fade-in';
        const time = new Date(message.timestamp);
        const timeString = time.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        messageDiv.innerHTML = `
            <span class="message-username">${message.username || 'Аноним'}:</span>
            <span style="color: #e0e0e0;">${this.escapeHtml(message.message || '')}</span>
            <span class="message-time">${timeString}</span>
        `;
        container.appendChild(messageDiv);
    }
    // Прокрутка чата вниз
    scrollToBottom(container) {
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    // Отправка сообщения в чат
    sendMessage() {
        const input = document.activeElement.closest('.chat-input')?.querySelector('input');
        if (!input || !this.user) return;
        const message = input.value.trim();
        if (!message) return;
        this.socket.emit('sendMessage', {
            userId: this.user.id,
            message: message
        });
        input.value = '';
    }
    // Защита от XSS атак
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '<',
            '>': '>',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
}
// Глобальная переменная для доступа к приложению
let gameApp;
// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add loading animation
    const loadingStyles = `
        .loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0a0a1a, #1a1a2e);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(106, 90, 205, 0.3);
            border-top: 5px solid #6a5acd;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    const style = document.createElement('style');
    style.textContent = loadingStyles;
    document.head.appendChild(style);
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loading);
    setTimeout(() => {
        try {
            gameApp = new CasinoRocket();
            // Remove loading after a delay
            setTimeout(() => {
                if (loading.parentNode) {
                    loading.parentNode.removeChild(loading);
                }
            }, 1000);
        } catch (error) {
            console.error('Error initializing game:', error);
            if (loading.parentNode) {
                loading.parentNode.removeChild(loading);
            }
        }
    }, 500);
});
