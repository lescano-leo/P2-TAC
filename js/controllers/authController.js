import { Storage } from '../repositories/storage.js';

export class AuthController {
    constructor() {
        this.apiUrl = 'https://mini-twitter-api-vy9q.onrender.com';
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validações básicas
        if (!email || !password) {
            this.showError('Por favor, preencha todos os campos');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('Por favor, insira um e-mail válido');
            return;
        }

        try {
            const response = await this.login(email, password);
            if (response.token) {
                Storage.setToken(response.token);
                Storage.setUser(response.user);
                window.location.replace('feed.html');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showError(error.message || 'Erro ao fazer login');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validações básicas
        if (!username || !email || !password || !confirmPassword) {
            this.showError('Por favor, preencha todos os campos');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('Por favor, insira um e-mail válido');
            return;
        }

        if (username.length < 3) {
            this.showError('O nome de usuário deve ter pelo menos 3 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            this.showError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        try {
            const response = await this.register(username, email, password);
            if (response.token) {
                Storage.setToken(response.token);
                Storage.setUser(response.user);
                window.location.replace('feed.html');
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            this.showError(error.message || 'Erro ao criar conta');
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao fazer login');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro na requisição de login:', error);
            throw new Error('Erro ao conectar com o servidor');
        }
    }

    async register(username, email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao criar conta');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro na requisição de registro:', error);
            throw new Error('Erro ao conectar com o servidor');
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message message-error';
        errorDiv.textContent = message;
        
        const form = document.querySelector('.auth-form');
        form.insertBefore(errorDiv, form.firstChild);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
} 