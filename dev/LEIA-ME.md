# Ferramentas locais (não fazem parte do site)

Para ver e testar o site no computador antes de publicar.

```bash
python3 dev/devserver.py
```

- Site: http://localhost:5173
- Visão mobile (o site dentro de um iPhone/Android, recarrega sozinha quando o código muda):
  http://localhost:5173/dev/mobile.html
- Modo TV (telão): http://localhost:5173/#/tv
- No seu celular (mesmo Wi-Fi do Mac): `python3 dev/devserver.py 5180 --rede` e abrir o endereço que ele mostra
  (ex.: http://10.255.0.118:5180). Dá para adicionar à tela inicial; o "funciona sem internet" só vale com https (site publicado).
- Logo: o GAME ao lado da arte de referência, em vários tamanhos: http://localhost:5173/dev/logo.html

Comparar versões antigas lado a lado (cada uma numa porta):

```bash
git worktree add ../srg-anterior c5da8e1                  # antes do preto e verde
python3 dev/devserver.py 5174 ../srg-anterior             # http://localhost:5174
```

Regra: nada vai para o ar (branch `main`, que o GitHub Pages publica) sem o Eder autorizar a versão.
