import { LuBike, LuBusFront, LuCarFront, LuFootprints, LuZap } from 'react-icons/lu';
const icons = { piedi: LuFootprints, bike: LuBike, car: LuCarFront, public_bus: LuBusFront, veicolo_elettrico: LuZap };
export default function TransportIcon({ type }) { const Icon = icons[type] || LuCarFront; return <Icon aria-hidden="true" />; }
