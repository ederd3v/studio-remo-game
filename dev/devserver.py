"""Servidor local do Studio Remo Game, sem cache (a visão mobile recarrega sozinha quando o código muda).

Uso (de dentro da pasta do repositório):
    python3 dev/devserver.py                        -> http://localhost:5173  e  /dev/mobile.html
    python3 dev/devserver.py 5174 ../srg-anterior   -> outra pasta numa outra porta (comparar versões)
    python3 dev/devserver.py 5180 --rede            -> também no Wi-Fi: abrir no celular pelo IP do Mac
"""
import functools
import http.server
import os
import socket
import sys
import threading

REDE = "--rede" in sys.argv  # escuta na rede de casa (celular no mesmo Wi-Fi), não só no próprio Mac
ARGS = [a for a in sys.argv[1:] if a != "--rede"]
PORTA = int(ARGS[0]) if ARGS else 5173
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # a raiz do repositório
RAIZ = os.path.abspath(ARGS[1]) if len(ARGS) > 1 else REPO


def ip_da_rede():
    # o IP do Mac no Wi-Fi (sem mandar nada para fora: a conexão UDP só escolhe a placa de rede)
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return "IP-do-Mac"
    finally:
        s.close()


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
    servidor = http.server.ThreadingHTTPServer(("0.0.0.0" if REDE else "127.0.0.1", PORTA), handler)
    # alguns navegadores resolvem "localhost" para ::1 primeiro: atende nos dois
    try:
        threading.Thread(target=SemCacheIPv6(("::1", PORTA), handler).serve_forever, daemon=True).start()
    except OSError:
        pass
    print(f"Servindo {RAIZ} em http://localhost:{PORTA}  ·  visão mobile em http://localhost:{PORTA}/dev/mobile.html", flush=True)
    if REDE:
        print(f"No celular (mesmo Wi-Fi): http://{ip_da_rede()}:{PORTA}", flush=True)
    servidor.serve_forever()
