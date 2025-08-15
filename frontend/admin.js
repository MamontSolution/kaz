class AdminPanel {
    constructor() {
        // Инициализация Socket.IO соединения
        this.socket = io();
        this.user = null;
        this.allUsers = [];

        // Инициализация всех элементов интерфейса
        this.initElements();
        // Инициализация обработчиков событий
        this.initEventListeners();
        // Инициализация обработчиков Socket.IO
        this.initSocketListeners();
        // Проверка авторизации
        this.checkAuth();
    }

    // Инициализация всех DOM элементов
    initElements() {
        // Навигация
        this.adminNavBtns = document.querySelectorAll('.admin-nav-btn');
        this.backToGame = document.getElementById('backToGame');

        // Секции
        this.usersSection = document.getElementById('usersSection');
        this.settingsSection = document.getElementById('settingsSection');
        this.gameControlSection = document.getElementById('gameControlSection');

        // Элементы пользователей
        this.usersTableBody = document.getElementById('usersTableBody');
        this.searchUser = document.getElementById('searchUser');
        this.newUsername = document.getElementById('newUsername');
        this.newEmail = document.getElementById('newEmail');
        this.newPassword = document.getElementById('newPassword');
        this.newBalance = document.getElementById('newBalance');
        this.addUserBtn = document.getElementById('addUserBtn');

        // Элементы настроек
        this.gameSettingsForm = document.getElementById('gameSettingsForm');
        this.adminCrashProbability = document.getElementById('adminCrashProbability');
        this.adminMinMultiplier = document.getElementById('adminMinMultiplier');
        this.adminMaxMultiplier = document.getElementById('adminMaxMultiplier');
        this.userIdForBalance = document.getElementById('userIdForBalance');
        this.balanceAmount = document.getElementById('balanceAmount');
        this.updateBalanceBtn = document.getElementById('updateBalanceBtn');

        // Элементы управления игрой
        this.forceGameStart = document.getElementById('forceGameStart');
        this.forceGameCrash = document.getElementById('forceGameCrash');
        this.adminMessage = document.getElementById('adminMessage');
        this.sendAdminMessage = document.getElementById('sendAdminMessage');
    }

    // Инициализация обработчиков событий
    initEventListeners() {
        // Навигация
        if (this.adminNavBtns) {
            this.adminNavBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.switchSection(e.target.dataset.section);
                });
            });
        }

        // Кнопка возврата к игре
        if (this.backToGame) {
            this.backToGame.addEventListener('click', () => {
                window.location.href = '/';
            });
        }

        // Пользователи
        if (this.addUserBtn) {
            this.addUserBtn.addEventListener('click', () => this.addUser());
        }

        if (this.searchUser) {
            this.searchUser.addEventListener('input', (e) => {
                this.filterUsers(e.target.value);
            });
        }

        // Настройки
        if (this.gameSettingsForm) {
            this.gameSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveGameSettings();
            });
        }

        if (this.updateBalanceBtn) {
            this.updateBalanceBtn.addEventListener('click', () => this.updateUserBalance());
        }

        // Управление игрой
        if (this.forceGameStart) {
            this.forceGameStart.addEventListener('click', () => this.forceGameStartAction());
        }

        if (this.forceGameCrash) {
            this.forceGameCrash.addEventListener('click', () => this.forceGameCrashAction());
        }

        if (this.sendAdminMessage) {
            this.sendAdminMessage.addEventListener('click', () => this.sendAdminMessageAction());
        }
    }

    // Инициализация обработчиков Socket.IO событий
    initSocketListeners() {
        // Получение всех пользователей
        this.socket.on('allUsers', (users) => {
            this.allUsers = users;
            this.updateUsersTable();
        });

        // Настройки игры
        this.socket.on('gameSettings', (settings) => {
            if (this.adminCrashProbability) {
                this.adminCrashProbability.value = settings.crashProbability;
            }
            if (this.adminMinMultiplier) {
                this.adminMinMultiplier.value = settings.minMultiplier;
            }
            if (this.adminMaxMultiplier) {
                this.adminMaxMultiplier.value = settings.maxMultiplier;
            }
        });

        // Ошибки
        this.socket.on('error', (message) => {
            this.showNotification(message, 'error');
        });

        // Уведомления
        this.socket.on('adminNotification', (data) => {
            this.showNotification(data.message, data.type || 'info');
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

    // Переключение секций
    switchSection(section) {
        // Update active nav button
        if (this.adminNavBtns) {
            this.adminNavBtns.forEach(btn => btn.classList.remove('active'));
        }
        const activeBtn = document.querySelector(`[data-section="${section}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Show active section
        if (this.usersSection) this.usersSection.classList.remove('active');
        if (this.settingsSection) this.settingsSection.classList.remove('active');
        if (this.gameControlSection) this.gameControlSection.classList.remove('active');

        const activeSection = document.getElementById(`${section}Section`);
        if (activeSection) {
            activeSection.classList.add('active');
        }

        // Load data for the section
        if (section === 'users') {
            this.loadAllUsers();
        } else if (section === 'settings') {
            this.loadGameSettings();
        }
    }

    // Проверка авторизации
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
                    if (!this.user.isAdmin) {
                        window.location.href = '/';
                        return;
                    }
                    this.socket.emit('authenticate', token);
                    // Load initial data
                    this.switchSection('users');
                } else {
                    window.location.href = '/';
                }
            } catch (error) {
                window.location.href = '/';
            }
        } else {
            window.location.href = '/';
        }
    }

    // Загрузка всех пользователей
    loadAllUsers() {
        this.socket.emit('getAllUsers');
    }

    // Обновление таблицы пользователей
    updateUsersTable(users = this.allUsers) {
        if (!this.usersTableBody) return;

        this.usersTableBody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id.substring(0, 8)}...</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td class="user-balance">💰 ${user.balance}</td>
                <td class="${user.isAdmin ? 'user-admin' : 'user-regular'}">
                    ${user.isAdmin ? '👑 Админ' : '👤 Пользователь'}
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editUser('${user.id}')" style="padding: 5px 10px; margin-right: 5px;">✏️</button>
                    ${!user.isAdmin ? `<button class="btn btn-sm btn-danger" onclick="adminPanel.deleteUser('${user.id}')" style="padding: 5px 10px;">🗑️</button>` : ''}
                </td>
            `;
            this.usersTableBody.appendChild(row);
        });
    }

    // Фильтрация пользователей
    filterUsers(searchTerm) {
        const filteredUsers = this.allUsers.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.updateUsersTable(filteredUsers);
    }

    // Добавление пользователя
    async addUser() {
        const username = this.newUsername.value;
        const email = this.newEmail.value;
        const password = this.newPassword.value;
        const balance = parseInt(this.newBalance.value) || 1000;

        if (!username || !email || !password) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ username, email, password, balance })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Пользователь добавлен', 'success');
                // Очищаем форму
                this.newUsername.value = '';
                this.newEmail.value = '';
                this.newPassword.value = '';
                this.newBalance.value = '1000';
                // Обновляем список пользователей
                this.loadAllUsers();
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка при добавлении пользователя', 'error');
        }
    }

    // Редактирование пользователя
    async editUser(userId) {
        const user = this.allUsers.find(u => u.id === userId);
        if (!user) return;

        const newBalance = prompt('Введите новый баланс:', user.balance);
        if (newBalance === null) return;

        const balance = parseInt(newBalance);
        if (isNaN(balance)) {
            this.showNotification('Введите корректное число', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}/balance`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ amount: balance - user.balance })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Баланс обновлен', 'success');
                this.loadAllUsers();
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка при обновлении баланса', 'error');
        }
    }

    // Удаление пользователя
    async deleteUser(userId) {
        if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Пользователь удален', 'success');
                this.loadAllUsers();
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка при удалении пользователя', 'error');
        }
    }

    // Загрузка настроек игры
    loadGameSettings() {
        this.socket.emit('getGameSettings');
    }

    // Сохранение настроек игры
    async saveGameSettings() {
        const crashProbability = parseFloat(this.adminCrashProbability.value);
        const minMultiplier = parseFloat(this.adminMinMultiplier.value);
        const maxMultiplier = parseFloat(this.adminMaxMultiplier.value);

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
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка при сохранении настроек', 'error');
        }
    }

    // Обновление баланса пользователя
    async updateUserBalance() {
        const userId = this.userIdForBalance.value;
        const amount = parseInt(this.balanceAmount.value);

        if (!userId || isNaN(amount)) {
            this.showNotification('Введите корректные данные', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}/balance`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ amount })
            });

            const data = await response.json();

            if (response.ok) {
                this.showNotification('Баланс обновлен', 'success');
                this.userIdForBalance.value = '';
                this.balanceAmount.value = '';
                this.loadAllUsers();
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка при обновлении баланса', 'error');
        }
    }

    // Принудительный запуск игры
    forceGameStartAction() {
        if (confirm('Вы уверены, что хотите начать игру сейчас?')) {
            this.socket.emit('forceGameStart');
            this.showNotification('Игра будет начата...', 'info');
        }
    }

    // Принудительный краш игры
    forceGameCrashAction() {
        if (confirm('Вы уверены, что хотите остановить игру?')) {
            this.socket.emit('forceGameCrash');
            this.showNotification('Игра будет остановлена...', 'info');
        }
    }

    // Отправка сообщения всем пользователям
    sendAdminMessageAction() {
        const message = this.adminMessage.value.trim();
        if (!message) {
            this.showNotification('Введите сообщение', 'error');
            return;
        }

        this.socket.emit('sendAdminMessage', { message });
        this.showNotification('Сообщение отправлено', 'success');
        this.adminMessage.value = '';
    }
}

// Глобальная переменная для доступа к админ панели
let adminPanel;

// Initialize the admin panel when page loads
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
            adminPanel = new AdminPanel();
            // Remove loading after a delay
            setTimeout(() => {
                if (loading.parentNode) {
                    loading.parentNode.removeChild(loading);
                }
            }, 1000);
        } catch (error) {
            console.error('Error initializing admin panel:', error);
            if (loading.parentNode) {
                loading.parentNode.removeChild(loading);
            }
        }
    }, 500);
});