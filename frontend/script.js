class CasinoRocket {
    constructor() {
        this.socket = io();
        this.user = null;
        this.currentBet = null;
        this.isGameRunning = false;
        this.isBettingPhase = false;
        this.multiplier = 1.00;
        this.timeUntilStart = 0;

        this.initElements();
        this.initEventListeners();
        this.initSocketListeners();
        this.checkAuth();
        this.initMobileFeatures();
    }

    initElements() {
        // Auth elements
        this.authModal = document.getElementById('authModal');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.tabBtns = document.querySelectorAll('.tab-btn');

        // Admin elements
        this.adminModal = document.getElementById('adminModal');
        this.adminSettingsForm = document.getElementById('adminSettingsForm');
        this.adminSettingsBtn = document.getElementById('adminSettingsBtn');
        this.adminSettingsBtnMobile = document.getElementById('adminSettingsBtnMobile');
        this.closeAdminModal = document.getElementById('closeAdminModal');

        // Game elements
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
        this.multiplierEl = document.getElementById('multiplier');
        this.betAmount = document.getElementById('betAmount');
        this.targetMultiplier = document.getElementById('targetMultiplier');
        this.placeBetBtn = document.getElementById('placeBetBtn');
        this.cashoutBtn = document.getElementById('cashoutBtn');
        this.betsList = document.getElementById('betsList');
        this.betsListMobile = document.getElementById('betsListMobile');
        this.historyList = document.getElementById('historyList');
        this.historyListMobile = document.getElementById('historyListMobile');

        // Quick bet buttons
        this.quickBetBtns = document.querySelectorAll('.quick-bet-btn');

        // Betting timers
        this.bettingTimer = document.getElementById('bettingTimer');
        this.bettingTimerDesktop = document.getElementById('bettingTimerDesktop');

        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.chatMessagesMobile = document.getElementById('chatMessagesMobile');
        this.chatInput = document.getElementById('chatInput');
        this.chatInputMobile = document.getElementById('chatInputMobile');
        this.sendChatBtn = document.getElementById('sendChatBtn');
        this.sendChatBtnMobile = document.getElementById('sendChatBtnMobile');

        // Mobile elements
        this.mobileMenu = document.getElementById('mobileMenu');
        this.menuToggle = document.getElementById('menuToggle');
        this.closeMenu = document.getElementById('closeMenu');
        this.mobileTabs = document.querySelectorAll('.mobile-tab');
        this.mobileTabPanes = document.querySelectorAll('.mobile-tab-pane');
    }

    initEventListeners() {
        // Auth tabs
        if (this.tabBtns) {
            this.tabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.switchTab(e.target.dataset.tab);
                });
            });
        }

        // Auth forms
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

        // Admin settings
        if (this.adminSettingsBtn) {
            this.adminSettingsBtn.addEventListener('click', () => this.showAdminSettings());
        }
        if (this.adminSettingsBtnMobile) {
            this.adminSettingsBtnMobile.addEventListener('click', () => this.showAdminSettings());
        }
        if (this.closeAdminModal) {
            this.closeAdminModal.addEventListener('click', () => this.hideAdminSettings());
        }
        if (this.adminSettingsForm) {
            this.adminSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAdminSettings();
            });
        }

        // Quick bet buttons
        if (this.quickBetBtns) {
            this.quickBetBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const amount = parseInt(e.target.dataset.amount);
                    this.addQuickBet(amount);
                });
            });
        }

        // Game controls
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

        // Chat
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

        // Mobile menu
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

        // Mobile tabs
        if (this.mobileTabs) {
            this.mobileTabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    this.switchMobileTab(e.target.dataset.tab);
                });
            });
        }

        // Close modals when clicking outside
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

    initMobileFeatures() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateLayout();
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateLayout();
            }, 100);
        });

        // Prevent zoom on input focus
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

    initSocketListeners() {
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
        });

        this.socket.on('bettingPhaseStarted', (data) => {
            this.isBettingPhase = true;
            this.isGameRunning = false;
            this.timeUntilStart = data.timeUntilStart || 10000;
            this.multiplier = 1.00;
            if (this.multiplierEl) {
                this.multiplierEl.textContent = '1.00x';
            }
            this.currentBet = null;
            if (this.cashoutBtn) {
                this.cashoutBtn.disabled = true;
            }

            this.showBettingTimer();
            this.updatePlaceBetButton();
            this.clearBets();
        });

        this.socket.on('bettingCountdown', (timeLeft) => {
            this.timeUntilStart = timeLeft;
            this.updateBettingTimer();
        });

        this.socket.on('gameStarted', (state) => {
            this.isBettingPhase = false;
            this.isGameRunning = true;
            this.multiplier = 1.00;
            if (this.multiplierEl) {
                this.multiplierEl.textContent = '1.00x';
            }
            this.startRocketAnimation();
            this.updateBets(state.bets || []);
            this.updatePlaceBetButton();
        });

        this.socket.on('multiplierUpdate', (multiplier) => {
            this.multiplier = multiplier;
            if (this.multiplierEl) {
                this.multiplierEl.textContent = multiplier.toFixed(2) + 'x';
                if (multiplier > 5) {
                    this.multiplierEl.style.color = '#ff5722';
                    this.multiplierEl.style.animation = 'glow 0.5s infinite alternate';
                } else if (multiplier > 2) {
                    this.multiplierEl.style.color = '#ffeb3b';
                } else {
                    this.multiplierEl.style.color = '#00ffff';
                    this.multiplierEl.style.animation = 'glow 2s infinite alternate';
                }
            }
            this.updateRocketPosition(multiplier);
            this.updateBetsDisplay();
        });

        this.socket.on('gameCrashed', (multiplier) => {
            this.isGameRunning = false;
            this.crashRocket();
            this.currentBet = null;
            if (this.cashoutBtn) {
                this.cashoutBtn.disabled = true;
            }
            this.updatePlaceBetButton();
        });

        this.socket.on('newBet', (bet) => {
            this.addBetToList(bet);
        });

        this.socket.on('updateBets', (bets) => {
            this.updateBets(bets);
        });

        this.socket.on('updateHistory', (history) => {
            this.updateHistory(history);
        });

        this.socket.on('betCashedOut', (data) => {
            this.updateBetCashedOut(data);
        });

        this.socket.on('balanceUpdate', (data) => {
            if (this.user && this.user.id === data.userId) {
                this.user.balance = data.balance;
                this.updateUserInfo();
            }
        });

        this.socket.on('error', (message) => {
            this.showNotification(message, 'error');
        });

        // Chat
        this.socket.on('chatHistory', (messages) => {
            this.updateChat(messages);
        });

        this.socket.on('newMessage', (message) => {
            this.addMessageToChat(message);
        });

        // Online count
        this.socket.on('onlineCount', (count) => {
            if (this.onlineCountEl) {
                this.onlineCountEl.textContent = count;
            }
            if (this.onlineCountMobile) {
                this.onlineCountMobile.textContent = count;
            }
        });

        // Admin
        this.socket.on('gameSettings', (settings) => {
            if (document.getElementById('crashProbability')) {
                document.getElementById('crashProbability').value = settings.crashProbability;
                document.getElementById('minMultiplier').value = settings.minMultiplier;
                document.getElementById('maxMultiplier').value = settings.maxMultiplier;
            }
        });
    }

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

    hideBettingTimer() {
        if (this.bettingTimer) {
            this.bettingTimer.style.display = 'none';
        }
        if (this.bettingTimerDesktop) {
            this.bettingTimerDesktop.style.display = 'none';
        }
    }

    updateBettingTimer() {
        const seconds = Math.ceil(this.timeUntilStart / 1000);
        const timerText = `Ставки: ${seconds}с`;

        if (this.bettingTimer) {
            this.bettingTimer.textContent = timerText;
        }
        if (this.bettingTimerDesktop) {
            this.bettingTimerDesktop.textContent = timerText;
        }
    }

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

    showAuth() {
        if (this.authModal) this.authModal.style.display = 'flex';
        if (this.gameContainer) this.gameContainer.style.display = 'none';
        this.hideAdminSettings();

        // Close mobile menu
        if (this.mobileMenu) {
            this.mobileMenu.style.display = 'none';
        }
    }

    showGame() {
        if (this.authModal) this.authModal.style.display = 'none';
        if (this.gameContainer) this.gameContainer.style.display = 'block';
        this.hideAdminSettings();
    }

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

    updateAdminButton() {
        const isAdmin = this.user && this.user.isAdmin;

        if (this.adminSettingsBtn) {
            this.adminSettingsBtn.style.display = isAdmin ? 'block' : 'none';
        }
        if (this.adminSettingsBtnMobile) {
            this.adminSettingsBtnMobile.style.display = isAdmin ? 'flex' : 'none';
        }
    }

    showAdminSettings() {
        if (this.adminModal) this.adminModal.style.display = 'flex';
        this.socket.emit('getGameSettings');

        // Close mobile menu
        if (this.mobileMenu) {
            this.mobileMenu.style.display = 'none';
        }
    }

    hideAdminSettings() {
        if (this.adminModal) this.adminModal.style.display = 'none';
    }

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

    async logout() {
        localStorage.removeItem('token');
        this.user = null;
        this.showAuth();

        // Close mobile menu
        if (this.mobileMenu) {
            this.mobileMenu.style.display = 'none';
        }
    }

    updatePlaceBetButton() {
        if (!this.placeBetBtn) return;

        if (this.isBettingPhase) {
            this.placeBetBtn.disabled = false;
            this.placeBetBtn.textContent = '🚀 Сделать ставку';
            this.placeBetBtn.className = 'btn btn-success btn-lg';
        } else if (this.isGameRunning) {
            this.placeBetBtn.disabled = true;
            this.placeBetBtn.textContent = '🎮 Игра началась';
            this.placeBetBtn.className = 'btn btn-warning btn-lg';
        } else {
            this.placeBetBtn.disabled = true;
            this.placeBetBtn.textContent = '⏳ Ожидание ставок';
            this.placeBetBtn.className = 'btn btn-secondary btn-lg';
        }
    }

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

        // Clear input
        if (this.betAmount) {
            this.betAmount.value = '';
        }
    }

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

    startRocketAnimation() {
        if (this.rocket) {
            this.rocket.style.bottom = '0';
            this.rocket.style.transform = 'translateX(-50%)';
            this.rocket.classList.remove('rocket-crash');
            this.rocket.style.transition = 'bottom 0.1s linear';
        }
        this.hideBettingTimer();
    }

    updateRocketPosition(multiplier) {
        if (this.rocket) {
            const maxHeight = window.innerWidth < 769 ? 200 : 350;
            const position = Math.min(maxHeight * (multiplier / 15), maxHeight);
            this.rocket.style.bottom = position + 'px';

            if (multiplier > 5) {
                this.rocket.style.transform = 'translateX(-50%) scale(1.2)';
                this.rocket.style.filter = 'drop-shadow(0 0 20px #ff5722)';
            } else if (multiplier > 2) {
                this.rocket.style.transform = 'translateX(-50%) scale(1.1)';
                this.rocket.style.filter = 'drop-shadow(0 0 15px #ffeb3b)';
            } else {
                this.rocket.style.transform = 'translateX(-50%) scale(1)';
                this.rocket.style.filter = 'drop-shadow(0 0 10px #00ffff)';
            }
        }
    }

    crashRocket() {
        if (this.rocket) {
            this.rocket.classList.add('rocket-crash');
            this.rocket.style.filter = 'drop-shadow(0 0 30px #ff0000)';
        }
        this.hideBettingTimer();
        setTimeout(() => {
            if (this.rocket) {
                this.rocket.style.bottom = '0';
                this.rocket.style.transform = 'translateX(-50%)';
                this.rocket.style.filter = 'none';
                this.rocket.classList.remove('rocket-crash');
            }
            if (this.cashoutBtn) {
                this.cashoutBtn.disabled = true;
            }
            this.updatePlaceBetButton();
        }, 1000);
    }

    updateBets(bets) {
        this.updateBetsList(bets, this.betsList);
        this.updateBetsList(bets, this.betsListMobile);
    }

    updateBetsList(bets, container) {
        if (container) {
            container.innerHTML = '';
            bets.forEach(bet => this.addBetToContainer(bet, container));
        }
    }

    addBetToList(bet) {
        this.addBetToContainer(bet, this.betsList);
        this.addBetToContainer(bet, this.betsListMobile);
    }

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

    clearBets() {
        if (this.betsList) this.betsList.innerHTML = '';
        if (this.betsListMobile) this.betsListMobile.innerHTML = '';
    }

    updateBetsDisplay() {
        if (!this.isGameRunning) return;

        // Update current multipliers in all bet lists
        const betItems = document.querySelectorAll('.bet-item:not(.winner):not(.loser) .bet-current-multiplier');
        betItems.forEach(item => {
            item.textContent = this.multiplier.toFixed(2) + 'x';
        });
    }

    updateBetCashedOut(data) {
        // Обновляем UI для закэшированной ставки
        if (data.auto && data.targetMultiplier) {
            this.showNotification(`Авто кэш! ${data.username} выиграл ${(data.winnings || 0)} при ${data.targetMultiplier}x`, 'success');
        }
    }

    updateHistory(history) {
        this.updateHistoryList(history, this.historyList);
        this.updateHistoryList(history, this.historyListMobile);
    }

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

    // Chat methods
    updateChat(messages) {
        this.updateChatMessages(messages, this.chatMessages);
        this.updateChatMessages(messages, this.chatMessagesMobile);
    }

    updateChatMessages(messages, container) {
        if (!container) return;

        container.innerHTML = '';
        messages.forEach(message => this.addMessageToContainer(message, container));
        container.scrollTop = container.scrollHeight;
    }

    addMessageToChat(message) {
        this.addMessageToContainer(message, this.chatMessages);
        this.addMessageToContainer(message, this.chatMessagesMobile);
        this.scrollToBottom(this.chatMessages);
        this.scrollToBottom(this.chatMessagesMobile);
    }

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

    scrollToBottom(container) {
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

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

    // Helper function to prevent XSS
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
            new CasinoRocket();
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