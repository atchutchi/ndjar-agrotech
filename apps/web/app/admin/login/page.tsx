import React from "react";

const errorMessages = {
  invalid: "Credenciais inválidas. Confirma os dados e tenta novamente.",
  session: "A sessão terminou. Inicia sessão novamente.",
} as const;

interface AdminLoginPageProps {
  searchParams?: Promise<{ error?: string | string[] }>;
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const error = (await searchParams)?.error;
  const errorCode = Array.isArray(error) ? error[0] : error;
  const errorMessage =
    errorCode && errorCode in errorMessages
      ? errorMessages[errorCode as keyof typeof errorMessages]
      : null;

  return (
    <main className="admin-login">
      <section
        className="admin-login-panel"
        aria-labelledby="admin-login-title"
      >
        <p className="eyebrow">Acesso protegido</p>
        <h1 id="admin-login-title">Entrar no N'djar Admin</h1>
        {errorMessage ? (
          <p className="admin-login-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
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
