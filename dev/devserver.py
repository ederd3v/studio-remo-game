"""Servidor local do Studio Remo Game, sem cache (a visão mobile recarrega sozinha quando o código muda).

Uso (de dentro da pasta do repositório):
    python3 dev/devserver.py                        -> http://localhost:5173  e  /dev/mobile.html
    python3 dev/devserver.py 5174 ../srg-anterior   -> outra pasta numa outra porta (comparar versões)
"""
import functools
import http.server
import os
import socket
import sys
import threading

PORTA = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # a raiz do repositório
RAIZ = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else REPO


class SemCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, *args):
        pass


class SemCacheIPv6(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6


if __name__ == "__main__":
    handler = functools.partial(SemCache, directory=RAIZ)
    servidor = http.server.ThreadingHTTPServer(("127.0.0.1", PORTA), handler)
    # alguns navegadores resolvem "localhost" para ::1 primeiro: atende nos dois
    try:
        threading.Thread(target=SemCacheIPv6(("::1", PORTA), handler).serve_forever, daemon=True).start()
    except OSError:
        pass
    print(f"Servindo {RAIZ} em http://localhost:{PORTA}  ·  visão mobile em http://localhost:{PORTA}/dev/mobile.html", flush=True)
    servidor.serve_forever()
