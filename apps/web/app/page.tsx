import Link from "next/link";
import React from "react";

import { buildPilotOverview } from "../lib/pilot-summary";

const supportContact = {
  name: "Equipa N'djar",
  phone: "+245 956 086 144",
  email: "info@abiptom.com",
  area: "Bairro de Ajuda 1ª Fase, Bissau",
};

const serviceCards = [
  {
    title: "Dados agrícolas",
    text: "Mapa do piloto, comunidades, culturas observadas e tarefas sazonais para orientar a operação no terreno.",
    meta: "Fonte: fixtures do piloto Sul",
  },
  {
    title: "Médico Agrícola",
    text: "Entrada para consultas técnicas com triagem prudente. Perguntas de risco devem ser revistas por consultor humano.",
    meta: "MVP sem diagnóstico automático final",
  },
  {
    title: "Offline e USSD",
    text: "A app mobile é o canal principal. Offline e USSD entram na fase 2 para zonas com conectividade limitada.",
    meta: "USSD 333# previsto",
  },
  {
    title: "Apoio ao produtor",
    text: "Contacto directo para dúvidas, recolha de amostras, validação de dados e encaminhamento operacional.",
    meta: supportContact.phone,
  },
];

const mvpStates = [
  "Dados locais carregados por fixtures",
  "Sem dependência de base de dados real",
  "Admin com autenticação protegida",
  "Recomendações dependem de validação técnica",
];

export default function HomePage() {
  const overview = buildPilotOverview();
  const featuredCrops = overview.cropLabels.slice(0, 6);

  return (
    <main>
      <section className="top-shell" aria-labelledby="home-title">
        <nav className="top-nav" aria-label="Navegação principal">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              N
            </span>
            <span>N'djar</span>
          </Link>
          <div className="nav-actions">
            <a href="#contacto">Contacto</a>
            <Link className="admin-link" href="/admin">
              Admin
            </Link>
          </div>
        </nav>

        <div className="operations-grid">
          <div className="intro-panel">
            <p className="eyebrow">Piloto Sul · {overview.locationLabel}</p>
            <h1 id="home-title">
              N'djar coordena dados agrícolas para decisões no campo.
            </h1>
            <p className="lead">
              MVP público para acompanhar o piloto de Quinara/Buba, explicar os
              módulos da app mobile e abrir a entrada de administração sem ligar
              a contas externas.
            </p>
            <div className="status-strip" aria-label="Estado do MVP">
              <span className="status-dot" aria-hidden="true" />
              <span>MVP operacional em fundação web</span>
            </div>
          </div>

          <div className="pilot-panel" aria-label="Resumo do piloto">
            <div className="panel-header">
              <span>Painel do piloto</span>
              <strong>
                {overview.regionName}, sector {overview.sectorName}
              </strong>
            </div>
            <div className="metric-grid">
              <Metric
                label="Comunidades"
                value={overview.communityCount.toString()}
                note="Sare Donha, Uane e Ugui"
              />
              <Metric
                label="Culturas"
                value={overview.cropCount.toString()}
                note="Observadas no piloto"
              />
              <Metric
                label="Área"
                value={`${overview.totalAreaHectares} ha`}
                note="Estimativa por comunidade"
              />
              <Metric
                label="pH exemplo"
                value={overview.phExample.value.toFixed(1)}
                note="Não validado em laboratório"
                tone="warning"
              />
            </div>
            <div className="mini-map" aria-label="Comunidades do piloto">
              {overview.communities.map((community, index) => (
                <span
                  className={`map-node map-node-${index + 1}`}
                  key={community}
                >
                  {community}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-grid" aria-labelledby="pilot-title">
        <div className="section-copy">
          <p className="eyebrow">Base de dados local</p>
          <h2 id="pilot-title">
            Piloto Quinara/Buba com dados reais dos fixtures.
          </h2>
          <p>
            A web mostra o mesmo ponto de partida da app mobile: comunidades do
            sector de Buba, culturas registadas, calendário agrícola e uma
            amostra de pH marcada como exemplo. O dado de pH não deve ser usado
            para dosagem, calagem ou recomendação final.
          </p>
        </div>
        <div className="card-stack">
          <div className="data-card">
            <span className="card-label">Comunidades</span>
            <div className="tag-list">
              {overview.communities.map((community) => (
                <span key={community}>{community}</span>
              ))}
            </div>
          </div>
          <div className="data-card">
            <span className="card-label">Culturas observadas</span>
            <div className="tag-list">
              {featuredCrops.map((crop) => (
                <span key={crop}>{crop}</span>
              ))}
              <span>+{overview.cropCount - featuredCrops.length}</span>
            </div>
          </div>
          <div className="data-card">
            <span className="card-label">Calendário</span>
            <strong>{overview.calendarTaskCount} tarefas sazonais</strong>
            <p>Preparação, plantação, monda, colheita e pós-colheita.</p>
          </div>
        </div>
      </section>

      <section className="services-section" aria-labelledby="services-title">
        <div className="section-heading">
          <p className="eyebrow">Módulos públicos</p>
          <h2 id="services-title">
            O que a web deve explicar antes do admin crescer.
          </h2>
        </div>
        <div className="service-grid">
          {serviceCards.map((service) => (
            <article className="service-card" key={service.title}>
              <span>{service.meta}</span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="status-section" aria-labelledby="mvp-title">
        <div>
          <p className="eyebrow">Estado consciente</p>
          <h2 id="mvp-title">
            MVP claro, sem prometer o que ainda não existe.
          </h2>
        </div>
        <ul className="state-list">
          {mvpStates.map((state) => (
            <li key={state}>{state}</li>
          ))}
        </ul>
      </section>

      <section
        className="contact-section"
        id="contacto"
        aria-labelledby="contact-title"
      >
        <div>
          <p className="eyebrow">Contacto de apoio</p>
          <h2 id="contact-title">{supportContact.name}</h2>
          <p>
            Canal de apoio para pilotos, dados de campo, amostras e dúvidas
            sobre a entrada operacional do MVP.
          </p>
        </div>
        <address>
          <a href={`tel:${supportContact.phone.replaceAll(" ", "")}`}>
            {supportContact.phone}
          </a>
          <a href={`mailto:${supportContact.email}`}>{supportContact.email}</a>
          <span>{supportContact.area}</span>
        </address>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  note,
  tone = "primary",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "primary" | "warning";
}) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
