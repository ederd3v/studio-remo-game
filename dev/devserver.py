"""Servidor local do Studio Remo Game, sem cache (a visão mobile recarrega sozinha quando o código muda).

Uso (de dentro da pasta do repositório):
    python3 dev/devserver.py          -> http://localhost:5173  e  http://localhost:5173/dev/mobile.html
    python3 dev/devserver.py 5174     -> outra porta (para comparar versões lado a lado)
"""
import functools
import http.server
import os
import sys

PORTA = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # a raiz do repositório


class SemCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    servidor = http.server.ThreadingHTTPServer(("127.0.0.1", PORTA), functools.partial(SemCache, directory=RAIZ))
    print(f"Studio Remo Game em http://localhost:{PORTA}  ·  visão mobile em http://localhost:{PORTA}/dev/mobile.html", flush=True)
    servidor.serve_forever()
