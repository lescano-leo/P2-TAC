import { Storage } from '../repositories/storage.js';

export class ProfileController {
    constructor() {
        this.apiUrl = 'https://mini-twitter-api-vy9q.onrender.com';
        this.profileForm = document.getElementById('profileForm');
        this.postsContainer = document.getElementById('userPosts');
        this.setupEventListeners();
        this.loadProfile();
        this.loadUserPosts();
    }

    setupEventListeners() {
        if (this.profileForm) {
            this.profileForm.addEventListener('submit', this.handleProfileUpdate.bind(this));
        }
    }

    async handleProfileUpdate(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();

        if (!username || !email) {
            this.showError('Por favor, preencha todos os campos');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('Por favor, insira um e-mail válido');
            return;
        }

        try {
            await this.updateProfile(username, email);
            this.showSuccess('Perfil atualizado com sucesso');
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            this.showError(error.message || 'Erro ao atualizar perfil');
        }
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    async loadProfile() {
        const token = Storage.getToken();
        if (!token) {
            window.location.replace('login.html');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/api/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar perfil');
            }

            const profile = await response.json();
            this.renderProfile(profile);
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            this.showError('Erro ao carregar perfil');
        }
    }

    async loadUserPosts() {
        const token = Storage.getToken();
        if (!token) {
            window.location.replace('login.html');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/api/posts/my-posts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar postagens');
            }

            const posts = await response.json();
            console.log('Postagens carregadas:', posts);
            this.renderPosts(posts);
        } catch (error) {
            console.error('Erro ao carregar postagens:', error);
            this.showError('Erro ao carregar postagens');
        }
    }

    async updateProfile(username, email) {
        const token = Storage.getToken();
        if (!token) {
            throw new Error('Usuário não autenticado');
        }

        try {
            const response = await fetch(`${this.apiUrl}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username, email })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao atualizar perfil');
            }

            const data = await response.json();
            Storage.setUser(data.user);
            return data;
        } catch (error) {
            console.error('Erro na requisição de atualização de perfil:', error);
            throw new Error('Erro ao conectar com o servidor');
        }
    }

    renderProfile(profile) {
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const createdAtElement = document.getElementById('createdAt');

        if (usernameInput) usernameInput.value = profile.username;
        if (emailInput) emailInput.value = profile.email;
        if (createdAtElement) {
            createdAtElement.textContent = `Membro desde ${this.formatDate(profile.createdAt)}`;
        }
    }

    renderPosts(posts) {
        if (!this.postsContainer) {
            console.error('Container de postagens não encontrado');
            return;
        }

        this.postsContainer.innerHTML = '';
        
        if (!posts || posts.length === 0) {
            this.postsContainer.innerHTML = `
                <div class="no-posts">
                    <i class="fas fa-comment-slash"></i>
                    <p>Nenhuma postagem encontrada</p>
                </div>
            `;
            return;
        }

        posts.forEach(post => {
            const postElement = this.createPostElement(post);
            this.postsContainer.appendChild(postElement);
        });
    }

    createPostElement(post) {
        const div = document.createElement('div');
        div.className = 'post';
        div.innerHTML = `
            <div class="post-header">
                <div class="post-info">
                    <span class="post-date">${this.formatDate(post.createdAt)}</span>
                </div>
                <button class="btn btn-danger delete-post" data-id="${post._id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="post-content">${post.content}</div>
        `;

        const deleteButton = div.querySelector('.delete-post');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => this.deletePost(post._id));
        }

        return div;
    }

    async deletePost(postId) {
        if (!confirm('Tem certeza que deseja excluir esta postagem?')) {
            return;
        }

        const token = Storage.getToken();
        if (!token) {
            window.location.replace('login.html');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/api/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir postagem');
            }

            this.loadUserPosts();
        } catch (error) {
            console.error('Erro ao excluir post:', error);
            this.showError('Erro ao excluir postagem');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message message-error';
        errorDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(errorDiv, container.firstChild);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'message message-success';
        successDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(successDiv, container.firstChild);

        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
} 