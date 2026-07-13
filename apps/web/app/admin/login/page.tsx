import React from "react";

export default function AdminLoginPage() {
  return (
    <main className="admin-login">
      <section
        className="admin-login-panel"
        aria-labelledby="admin-login-title"
      >
        <p className="eyebrow">Acesso protegido</p>
        <h1 id="admin-login-title">Entrar no N'djar Admin</h1>
        <form action="/api/admin/login" method="post">
          <label>
            Telefone ou email
            <input
              autoComplete="username"
              name="identifier"
              required
              type="text"
            />
          </label>
          <label>
            Palavra-passe
            <input
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </label>
          <button type="submit">Entrar</button>
        </form>
      </section>
    </main>
  );
}
