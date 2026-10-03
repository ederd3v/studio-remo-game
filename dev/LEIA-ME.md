# Ferramentas locais (não fazem parte do site)

Para ver e testar o site no computador antes de publicar.

```bash
python3 dev/devserver.py
```

- Site: http://localhost:5173
- Visão mobile (o site dentro de um iPhone/Android, recarrega sozinha quando o código muda):
  http://localhost:5173/dev/mobile.html
- Modo TV (telão): http://localhost:5173/#/tv
- Logo: as variações da camuflagem do GAME lado a lado em http://localhost:5173/dev/logo.html
  (para ver uma variação no site todo: `?camo=b` ou `?camo=c` na URL)

Comparar versões antigas lado a lado (cada uma numa porta):

```bash
git worktree add ../srg-anterior c5da8e1                  # antes do preto e verde
python3 dev/devserver.py 5174 ../srg-anterior             # http://localhost:5174
```

Regra: nada vai para o ar (branch `main`, que o GitHub Pages publica) sem o Eder autorizar a versão.
