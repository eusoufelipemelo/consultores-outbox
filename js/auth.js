/* ============================================================
   OutBox Consultores — Autenticação (auth.js)
   Login · Cadastro · Google (simulado) · Esqueci a senha · 2FA
   Protótipo: senhas em localStorage, e-mails/2FA simulados na tela.
   ============================================================ */
const Auth = {
  mode: 'login', // login | signup

  aside() {
    return `
    <div class="grid-fx"></div>
    <div>
      <img class="a-logo" src="assets/logo-branca.svg" alt="OutBox Soluções Digitais"/>
      <h1>Portal do <b>Consultor</b><br/>OutBox Soluções Digitais</h1>
      <p>Gerencie suas vendas, clientes, comissões e prêmios em um só lugar. Acompanhe suas metas em tempo real e cresça de Bronze a Black.</p>
    </div>
    <div class="auth-feats">
      <div class="auth-feat"><span class="dot">${UI.icon('trend', 16)}</span><div><b>Metas em tempo real</b><span>Comissão atualizada a cada venda lançada</span></div></div>
      <div class="auth-feat"><span class="dot">${UI.icon('prize', 16)}</span><div><b>Prêmios trimestrais</b><span>De AirPods a MacBook conforme seu volume</span></div></div>
      <div class="auth-feat"><span class="dot">${UI.icon('docs', 16)}</span><div><b>Método SPIN Selling</b><span>Materiais e técnicas de venda à disposição</span></div></div>
    </div>`;
  },

  render() {
    UI.closeModal(); // garante que nenhum modal fique preso sobre a tela de login
    const auth = document.getElementById('auth');
    auth.classList.remove('hidden');
    auth.style.display = 'grid';
    document.getElementById('app').style.display = 'none';

    auth.innerHTML = `
      <div class="auth-theme">${App.themeBtnHTML()}</div>
      <aside class="auth-aside">${this.aside()}</aside>
      <main class="auth-main"><div class="auth-card" id="auth-card"></div></main>`;

    App.bindThemeBtn(auth);
    this.mode === 'login' ? this.viewLogin() : this.viewSignup();
  },

  viewLogin() {
    this.mode = 'login';
    document.getElementById('auth-card').innerHTML = `
      <img class="mob-logo" src="assets/logo-${App.theme === 'dark' ? 'branca' : 'preta'}.svg"/>
      <h2>Bem-vindo de volta</h2>
      <p class="sub">Acesse sua conta para continuar</p>

      <form id="form-login">
        <div class="field">
          <label>E-mail</label>
          <input type="email" id="li-email" placeholder="voce@outboxgroup.com.br" autocomplete="email"/>
        </div>
        <div class="field">
          <label>Senha</label>
          ${this.pwdInput('li-senha', 'Sua senha')}
        </div>
        <div class="forgot"><a id="li-forgot">Esqueceu a senha?</a></div>
        <button class="btn brand block" type="submit">Entrar</button>
      </form>

      <div class="sep">ou continue com</div>
      <button class="google-btn" id="g-login">${this.googleIcon()} Entrar com Google</button>

      <p class="auth-foot">Não tem conta? <a id="go-signup">Criar conta</a></p>
      <div class="notice" style="margin-top:18px;text-align:left">${UI.icon('info',16)}<div>Primeiro acesso? Clique em <b>Criar conta</b>. Seus dados ficam salvos com segurança e o administrador acompanha tudo em tempo real.</div></div>
    `;
    this.bindPwdToggles();
    document.getElementById('go-signup').onclick = () => this.viewSignup();
    document.getElementById('g-login').onclick = () => this.googleFlow('login');
    document.getElementById('li-forgot').onclick = () => this.forgot();
    document.getElementById('form-login').onsubmit = (e) => { e.preventDefault(); this.doLogin(); };
  },

  viewSignup() {
    this.mode = 'signup';
    document.getElementById('auth-card').innerHTML = `
      <img class="mob-logo" src="assets/logo-${App.theme === 'dark' ? 'branca' : 'preta'}.svg"/>
      <h2>Criar conta</h2>
      <p class="sub">Comece a vender com a OutBox Soluções Digitais</p>

      <form id="form-signup">
        <div class="grid-2">
          <div class="field"><label>Nome</label><input id="su-nome" placeholder="Nome"/></div>
          <div class="field"><label>Sobrenome</label><input id="su-sobrenome" placeholder="Sobrenome"/></div>
        </div>
        <div class="field">
          <label>E-mail</label>
          <input type="email" id="su-email" placeholder="voce@email.com"/>
        </div>
        <div class="field">
          <label>Senha</label>
          ${this.pwdInput('su-senha', 'Mínimo 6 caracteres')}
          <div class="hint">Use 6 caracteres ou mais</div>
        </div>
        <div class="field">
          <label>Confirmar senha</label>
          ${this.pwdInput('su-senha2', 'Repita a senha')}
        </div>
        <button class="btn brand block" type="submit">Criar conta</button>
      </form>

      <div class="sep">ou continue com</div>
      <button class="google-btn" id="g-signup">${this.googleIcon()} Cadastrar com Google</button>

      <p class="auth-foot">Já tem conta? <a id="go-login">Entrar</a></p>
    `;
    this.bindPwdToggles();
    document.getElementById('go-login').onclick = () => this.viewLogin();
    document.getElementById('g-signup').onclick = () => this.googleFlow('signup');
    document.getElementById('form-signup').onsubmit = (e) => { e.preventDefault(); this.doSignup(); };
  },

  /* ---------- componentes ---------- */
  pwdInput(id, ph) {
    return `<div class="pwd-wrap">
      <input type="password" id="${id}" placeholder="${ph}" autocomplete="off"/>
      <button type="button" class="pwd-toggle" data-toggle="${id}" aria-label="Mostrar senha">${UI.icon('eye', 18)}</button>
    </div>`;
  },
  bindPwdToggles() {
    document.querySelectorAll('.pwd-toggle').forEach(btn => {
      btn.onclick = () => {
        const inp = document.getElementById(btn.dataset.toggle);
        const show = inp.type === 'password';
        inp.type = show ? 'text' : 'password';
        btn.innerHTML = UI.icon(show ? 'eyeoff' : 'eye', 18);
      };
    });
  },
  googleIcon() {
    return `<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.4 36 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>`;
  },

  /* ---------- LOGIN ---------- */
  async doLogin() {
    const email = document.getElementById('li-email').value.trim();
    const senha = document.getElementById('li-senha').value;
    if (!UI.validEmail(email)) return UI.toast('E-mail inválido', 'Confira o endereço digitado', 'err');
    if (!senha) return UI.toast('Informe a senha', '', 'err');
    const btn = document.querySelector('#form-login button[type=submit]');
    if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }
    const { error } = await SB.auth.signInWithPassword({ email, password: senha });
    if (error) {
      if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
      return UI.toast('Falha no login', 'E-mail ou senha incorretos', 'err');
    }
    await this.finish();
  },

  /* ---------- CADASTRO ---------- */
  async doSignup() {
    const nome = document.getElementById('su-nome').value.trim();
    const sobrenome = document.getElementById('su-sobrenome').value.trim();
    const email = document.getElementById('su-email').value.trim();
    const senha = document.getElementById('su-senha').value;
    const senha2 = document.getElementById('su-senha2').value;
    if (!nome || !sobrenome) return UI.toast('Preencha o nome', 'Nome e sobrenome são obrigatórios', 'err');
    if (!UI.validEmail(email)) return UI.toast('E-mail inválido', '', 'err');
    if (senha.length < 6) return UI.toast('Senha curta', 'Use ao menos 6 caracteres', 'err');
    if (senha !== senha2) return UI.toast('Senhas diferentes', 'A confirmação não confere', 'err');

    const btn = document.querySelector('#form-signup button[type=submit]');
    if (btn) { btn.disabled = true; btn.textContent = 'Criando...'; }
    const { data, error } = await SB.auth.signUp({ email, password: senha, options: { data: { nome, sobrenome } } });
    if (error) {
      if (btn) { btn.disabled = false; btn.textContent = 'Criar conta'; }
      const msg = /registered|already/i.test(error.message) ? 'E-mail já cadastrado, tente entrar' : error.message;
      return UI.toast('Não foi possível criar', msg, 'err');
    }
    if (!data.session) {
      if (btn) { btn.disabled = false; btn.textContent = 'Criar conta'; }
      return UI.toast('Verifique seu e-mail', 'Confirme o cadastro pelo link enviado', 'ok');
    }
    UI.toast('Conta criada!', 'Complete seu perfil para começar', 'ok');
    await this.finish(true);
  },

  /* ---------- GOOGLE (OAuth via Supabase) ---------- */
  async googleFlow(kind) {
    UI.toast('Redirecionando...', 'Abrindo login do Google', 'info');
    const { error } = await SB.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin + location.pathname }
    });
    if (error) UI.toast('Erro no Google', error.message, 'err');
  },

  /* ---------- ESQUECI A SENHA (e-mail real via Supabase) ---------- */
  forgot() {
    UI.modal({
      title: 'Redefinir senha',
      sub: 'Enviaremos um link de redefinição para o seu e-mail',
      body: `<div class="field"><label>E-mail cadastrado</label><input id="fg-email" placeholder="voce@outboxgroup.com.br"/></div>`,
      footer: `<button class="btn ghost" data-close>Cancelar</button><button class="btn brand" id="fg-send">${UI.icon('mail',16)} Enviar link</button>`
    });
    document.getElementById('fg-send').onclick = async () => {
      const email = document.getElementById('fg-email').value.trim();
      if (!UI.validEmail(email)) return UI.toast('E-mail inválido', '', 'err');
      const btn = document.getElementById('fg-send');
      btn.disabled = true; btn.textContent = 'Enviando...';
      await SB.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      UI.closeModal();
      // mensagem neutra por segurança (não revela se a conta existe)
      UI.toast('Verifique seu e-mail', 'Se a conta existir, enviamos o link de redefinição', 'ok');
    };
  },

  /* ---------- DEFINIR NOVA SENHA (após clicar no link do e-mail) ---------- */
  showSetNewPassword() {
    UI.modal({
      title: 'Definir nova senha',
      sub: 'Crie uma nova senha para sua conta',
      body: `<div class="field"><label>Nova senha</label>${this.pwdInput('np-pwd','Mínimo 6 caracteres')}</div>
        <div class="field"><label>Confirmar senha</label>${this.pwdInput('np-pwd2','Repita a senha')}</div>`,
      footer: `<button class="btn brand" id="np-go">Salvar nova senha</button>`
    });
    this.bindPwdToggles();
    document.getElementById('np-go').onclick = async () => {
      const p1 = document.getElementById('np-pwd').value, p2 = document.getElementById('np-pwd2').value;
      if (p1.length < 6) return UI.toast('Senha curta', 'Use ao menos 6 caracteres', 'err');
      if (p1 !== p2) return UI.toast('Senhas diferentes', '', 'err');
      const { error } = await SB.auth.updateUser({ password: p1 });
      if (error) return UI.toast('Erro', error.message, 'err');
      UI.closeModal();
      UI.toast('Senha redefinida!', 'Entrando...', 'ok');
      await this.finish();
    };
  },

  /* ---------- finaliza: carrega dados e entra no app ---------- */
  async finish(goProfile) {
    UI.closeModal();
    await OB.loadAll();
    document.getElementById('auth').style.display = 'none';
    App.boot(goProfile);
  }
};
