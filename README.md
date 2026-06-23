# OutBox Consultores

Sistema de gestão para os consultores da **OutBox Group**: login, cadastro de clientes,
lançamento de vendas, comissão progressiva (10% a 20%), premiações trimestrais,
documentos (método SPIN Selling) e painel administrativo de gestão financeira.

## Stack
- HTML/CSS/JS puro (sem build), tipografia Inter, dark/light mode.
- Gráficos via Chart.js (CDN).
- **Fase atual:** protótipo front-end com persistência em `localStorage`.
- **Próxima fase:** backend real com Supabase (auth, banco, e-mail, 2FA, storage).

## Deploy (EasyPanel)
- `Dockerfile` (nginx:alpine) incluído. Source = este repo, Build = Dockerfile, porta 80.
- Domínio: `consultores.outboxgroup.com.br` (HTTPS via Let's Encrypt).
- Atualizar = `git push` na `main` → Implantar no EasyPanel.

## Acessos de demonstração
- Admin: `admin@outboxgroup.com.br` / `admin123`
- Consultor: `consultor@outboxgroup.com.br` / `consultor123`
