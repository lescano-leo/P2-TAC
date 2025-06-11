import { Storage } from '../repositories/storage.js';

export class PostController {
    constructor() {
        this.apiUrl = 'https://mini-twitter-api-vy9q.onrender.com';
        this.postForm = document.getElementById('postForm');
        this.postsContainer = document.getElementById('postsContainer');
        this.setupEventListeners();
        this.loadPosts();
    }

    setupEventListeners() {
        if (this.postForm) {
            this.postForm.addEventListener('submit', this.handlePostSubmit.bind(this));
            const textarea = this.postForm.querySelector('textarea');
            if (textarea) {
                textarea.addEventListener('input', this.updateCharCount.bind(this));
            }
        }
    }

    async handlePostSubmit(event) {
        event.preventDefault();
        
        const textarea = document.getElementById('postContent');
        if (!textarea) {
            console.error('Textarea não encontrado');
            return;
        }

        const content = textarea.value.trim();
        
        if (!content) {
            this.showError('Por favor, escreva algo para postar');
            return;
        }

        if (content.length > 280) {
            this.showError('A postagem não pode ter mais de 280 caracteres');
            return;
        }

        try {
            await this.createPost(content);
            textarea.value = '';
            this.updateCharCount();
            this.loadPosts();
        } catch (error) {
            console.error('Erro ao criar post:', error);
            this.showError(error.message || 'Erro ao criar postagem');
        }
    }

    updateCharCount() {
        const textarea = document.getElementById('postContent');
        const charCount = this.postForm.querySelector('.char-count');
        if (textarea && charCount) {
            const count = textarea.value.length;
            const remaining = 280 - count;
            charCount.textContent = `${remaining} caracteres restantes`;
            charCount.className = 'char-count';
            if (remaining < 30) {
                charCount.classList.add('warning');
            }
            if (remaining < 0) {
                charCount.classList.add('error');
            }
        }
    }

    async createPost(content) {
        const token = Storage.getToken();
        if (!token) {
            throw new Error('Usuário não autenticado');
        }

        try {
            const response = await fetch(`${this.apiUrl}/api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao criar postagem');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro na requisição de criação de post:', error);
            throw new Error('Erro ao conectar com o servidor');
        }
    }

    async loadPosts() {
        const token = Storage.getToken();
        if (!token) {
            window.location.replace('login.html');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/api/posts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar postagens');
            }

            const posts = await response.json();
            this.renderPosts(posts);
        } catch (error) {
            console.error('Erro ao carregar posts:', error);
            this.showError('Erro ao carregar postagens');
        }
    }

    renderPosts(posts) {
        if (!this.postsContainer) return;

        this.postsContainer.innerHTML = '';
        
        if (posts.length === 0) {
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
                    <span class="post-author">${post.author.username}</span>
                    <span class="post-date">${this.formatDate(post.createdAt)}</span>
                </div>
                ${this.isCurrentUser(post.author._id) ? `
                    <button class="btn btn-danger delete-post" data-id="${post._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
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

            this.loadPosts();
        } catch (error) {
            console.error('Erro ao excluir post:', error);
            this.showError('Erro ao excluir postagem');
        }
    }

    isCurrentUser(authorId) {
        const user = Storage.getUser();
        return user && user.id === authorId;
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
} 