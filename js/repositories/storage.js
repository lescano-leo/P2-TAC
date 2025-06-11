export class Storage {
    static getToken() {
        return localStorage.getItem('token');
    }

    static setToken(token) {
        localStorage.setItem('token', token);
    }

    static removeToken() {
        localStorage.removeItem('token');
    }

    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    static setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    static removeUser() {
        localStorage.removeItem('user');
    }

    static clear() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    static isAuthenticated() {
        return !!this.getToken();
    }
} 