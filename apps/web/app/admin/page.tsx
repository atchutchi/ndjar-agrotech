import Link from "next/link";

const adminModules = [
  {
    title: "Regiões e comunidades",
    description:
      "Cadastro do piloto, sectores, comunidades, área estimada e origem dos dados.",
    status: "Base pronta",
  },
  {
    title: "Culturas",
    description:
      "Gestão de culturas locais, presença por comunidade e notas agronómicas.",
    status: "Fixtures disponíveis",
  },
  {
    title: "Amostras pH",
    description:
      "Fila para amostras de campo, validação laboratorial e histórico por parcela.",
    status: "Placeholder",
  },
  {
    title: "Consultas",
    description:
      "Triagem de perguntas, escalamento para consultor e acompanhamento de resposta.",
    status: "Placeholder",
  },
  {
    title: "Templates de resposta",
    description:
      "Respostas aprovadas para casos repetidos, com limites de segurança técnica.",
    status: "Placeholder",
  },
  {
    title: "Notificações",
    description:
      "Alertas por época agrícola, estado de amostras e seguimento de consultas.",
    status: "Fase posterior",
  },
  {
    title: "USSD",
    description:
      "Conteúdos compactos para consultas de baixo débito e fase 2 do MVP.",
    status: "Fase 2",
  },
  {
    title: "Conteúdo biblioteca",
    description:
      "Guias, boas práticas e conteúdos offline para agricultores e equipas técnicas.",
    status: "Placeholder",
  },
];

export default function AdminPage() {
  return (
    <main className="admin-shell">
      <nav className="top-nav admin-nav" aria-label="Navegação admin">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span>N'djar Admin</span>
        </Link>
        <Link className="admin-link" href="/">
          Overview público
        </Link>
      </nav>

      <section className="admin-header" aria-labelledby="admin-title">
        <div>
          <p className="eyebrow">Entrada administrativa</p>
          <h1 id="admin-title">Módulos futuros do backoffice N'djar.</h1>
          <p>
            Este placeholder marca a superfície de administração do MVP. Não há
            autenticação, escrita em base de dados ou contas externas nesta
            fase.
          </p>
        </div>
        <div className="admin-status">
          <span>Estado</span>
          <strong>Planeado para endurecer antes de produção</strong>
        </div>
      </section>

      <section className="module-grid" aria-label="Módulos administrativos">
        {adminModules.map((module) => (
          <article className="module-card" key={module.title}>
            <span>{module.status}</span>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
