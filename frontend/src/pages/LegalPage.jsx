import { Link } from 'react-router-dom';
import BrandHeader from '../components/BrandHeader.jsx';
import './LegalPage.css';

const sections = {
  privacy: {
    title: 'Informativa sulla privacy',
    updated: 'Aggiornata il 22 agosto 2026',
    paragraphs: [
      ['Dati trattati', 'EcoTrack tratta i dati necessari all’account, come nome utente, email e regione, oltre ai percorsi e alle stime di CO₂ che scegli di salvare. Con l’accesso Google riceviamo da Google soltanto le informazioni di base autorizzate: identificativo, nome ed email.'],
      ['Finalità', 'Usiamo questi dati per autenticarti, conservare lo storico, mostrare statistiche ambientali e abilitare le funzioni community. Non vendiamo i tuoi dati personali.'],
      ['Servizi utilizzati', 'L’autenticazione è gestita tramite Amazon Cognito; i dati applicativi sono ospitati su AWS. Il calcolo e la visualizzazione dei percorsi utilizzano Google Maps Platform.'],
      ['Conservazione e sicurezza', 'Conserviamo i dati finché l’account resta attivo o per il tempo necessario a fornire il servizio. Usiamo connessioni HTTPS, cookie di sessione protetti e credenziali separate dal codice pubblico.'],
      ['I tuoi diritti', 'Puoi chiedere accesso, correzione o cancellazione dei tuoi dati scrivendo a marco.tannoia@gmail.com.'],
    ],
  },
  terms: {
    title: 'Termini di utilizzo',
    updated: 'Aggiornati il 22 agosto 2026',
    paragraphs: [
      ['Uso del servizio', 'EcoTrack fornisce stime informative sull’impatto ambientale degli spostamenti. Le stime non sostituiscono dati certificati, indicazioni professionali o sistemi ufficiali di navigazione.'],
      ['Account', 'Devi fornire informazioni corrette, proteggere le tue credenziali e non usare il servizio per attività illecite, abusive o automatizzate che ne compromettano il funzionamento.'],
      ['Percorsi e servizi esterni', 'Mappe, distanze e indicazioni dipendono da servizi esterni e possono contenere imprecisioni o non essere disponibili temporaneamente. Verifica sempre le condizioni reali del percorso.'],
      ['Disponibilità', 'Il progetto può evolvere, cambiare o essere temporaneamente sospeso per manutenzione e sicurezza.'],
      ['Contatti', 'Per domande sul servizio o sui presenti termini puoi scrivere a marco.tannoia@gmail.com.'],
    ],
  },
};

export default function LegalPage({ type }) {
  const content = sections[type];
  return <div className="page legal-page"><BrandHeader subtitle="Trasparenza e sicurezza" /><section className="panel legal-panel"><Link className="legal-back" to="/login">← Torna a EcoTrack</Link><h1>{content.title}</h1><p className="legal-updated">{content.updated}</p>{content.paragraphs.map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}</section></div>;
}
