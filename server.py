import http.server
import socketserver
import sys
import os
import json
import urllib.request
from urllib.parse import urlparse, parse_qs

# Mini Twitter - Servidor HTTP para servir arquivos estáticos e redirecionar requisições da API
# Autor: Leonardo R. Lescano
# Obtém o diretório do script atual
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Configuração da API
API_URL = 'https://mini-twitter-api-vy9q.onrender.com'

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Define o diretório de trabalho como o diretório do script
        os.chdir(SCRIPT_DIR)
        super().__init__(*args, **kwargs)

    def do_GET(self):
        # Se o caminho for uma rota da API, redirecionar para a API real
        if self.path.startswith('/api/'):
            try:
                # Fazer a requisição para a API
                api_path = self.path[4:]  # Remove '/api' do início
                url = f"{API_URL}{api_path}"
                
                # Adicionar headers necessários
                headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
                
                # Verificar se há token no cookie
                if 'Cookie' in self.headers:
                    headers['Authorization'] = f"Bearer {self.headers['Cookie'].split('=')[1]}"
                
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req) as response:
                    data = response.read()
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(data)
                return
            except Exception as e:
                self.send_error(500, f"Erro ao comunicar com a API: {str(e)}")
                return

        # Remover a barra inicial do caminho
        path = self.path.lstrip('/')
        
        # Se o caminho estiver vazio, servir o index.html
        if not path:
            path = 'index.html'
        
        # Verificar se o arquivo existe
        file_path = os.path.join(SCRIPT_DIR, path)
        if not os.path.exists(file_path):
            self.path = '/index.html'
        
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        # Se o caminho for uma rota da API, redirecionar para a API real
        if self.path.startswith('/api/'):
            try:
                # Ler o corpo da requisição
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                # Fazer a requisição para a API
                api_path = self.path[4:]  # Remove '/api' do início
                url = f"{API_URL}{api_path}"
                
                # Adicionar headers necessários
                headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
                
                # Verificar se há token no cookie
                if 'Cookie' in self.headers:
                    headers['Authorization'] = f"Bearer {self.headers['Cookie'].split('=')[1]}"
                
                req = urllib.request.Request(url, data=post_data, headers=headers, method='POST')
                with urllib.request.urlopen(req) as response:
                    data = response.read()
                    
                    # Se for login ou registro, salvar o token no cookie
                    if api_path in ['/auth/login', '/auth/register']:
                        response_data = json.loads(data)
                        if 'token' in response_data:
                            self.send_header('Set-Cookie', f"token={response_data['token']}; Path=/")
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(data)
                return
            except Exception as e:
                self.send_error(500, f"Erro ao comunicar com a API: {str(e)}")
                return
        
        self.send_error(404, "Rota não encontrada")

    def end_headers(self):
        # Adicionar headers CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        super().end_headers()

    def do_OPTIONS(self):
        # Responder a requisições OPTIONS (CORS preflight)
        self.send_response(200)
        self.end_headers()

def start_server(port):
    try:
        Handler = CustomHTTPRequestHandler
        Handler.extensions_map.update({
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.html': 'text/html',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
        })

        with socketserver.TCPServer(("", port), Handler) as httpd:
            print(f"Servidor rodando em http://localhost:{port}")
            print("Pressione Ctrl+C para parar o servidor")
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nServidor parado pelo usuário")
    except OSError as e:
        if e.errno == 10048:  # Porta em uso
            print(f"Porta {port} está em uso. Tentando porta {port + 1}")
            start_server(port + 1)
        else:
            print(f"Erro ao iniciar o servidor: {e}")
            sys.exit(1)
    finally:
        print("Encerrando servidor...")
        sys.exit(0)

if __name__ == "__main__":
    start_server(8080)  # Começando com a porta 8080 