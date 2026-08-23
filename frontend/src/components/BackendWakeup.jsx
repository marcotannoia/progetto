export default function BackendWakeup() {
  return (
    <main className="wakeup-page" aria-live="polite">
      <section className="wakeup-content">
        <div className="wakeup-mark" aria-hidden="true">
          <span />
        </div>
        <p>Aspetta qualche secondo, continua a riaggiornare la pagina!</p>
      </section>
    </main>
  );
}
