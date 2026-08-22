import './Dock.css';
export default function Dock({ items }) {
  return <nav className="dock" aria-label="Navigazione principale">{items.map((item) => <button key={item.label} className={`dock-item ${item.active ? 'active' : ''} ${item.danger ? 'danger' : ''}`} type="button" onClick={item.onClick} aria-current={item.active ? 'page' : undefined}>{item.icon}<span>{item.label}</span></button>)}</nav>;
}
