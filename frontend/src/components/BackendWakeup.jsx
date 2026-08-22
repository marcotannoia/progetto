import { LuRefreshCw } from 'react-icons/lu';

export default function BackendWakeup({ onRetry }) {
  return (
    <main className="wakeup-page" aria-live="polite">
      <section className="wakeup-card">
        <div className="wakeup-mark" aria-hidden="true">
          <span />
        </div>
        <p className="wakeup-eyebrow">EcoTrack</p>
        <h1>Stiamo avviando il servizio</h1>
        <p>
          Il server gratuito di Render era in pausa e può impiegare fino a circa un minuto.
          Attendi: EcoTrack riproverà automaticamente.
        </p>
        <button className="secondary-button wakeup-retry" type="button" onClick={onRetry}>
          <LuRefreshCw />
          Riprova ora
        </button>
        <small>Se la schermata resta visibile, aggiorna la pagina.</small>
      </section>
    </main>
  );
}
