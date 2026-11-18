import React from 'react';
import { useGame } from '../../context/GameContext.js';
import { 
  ScrollText, 
  Dices, 
  ShoppingCart, 
  CreditCard, 
  Lock, 
  Sparkles, 
  ArrowLeftRight, 
  Gavel, 
  Building 
} from 'lucide-react';

export const ActivityLogFeed: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState) return null;

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'roll': return <Dices className="w-3.5 h-3.5 text-blue-400" />;
      case 'buy': return <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />;
      case 'rent': return <CreditCard className="w-3.5 h-3.5 text-red-400" />;
      case 'jail': return <Lock className="w-3.5 h-3.5 text-orange-400" />;
      case 'card': return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'trade': return <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />;
      case 'auction': return <Gavel className="w-3.5 h-3.5 text-amber-400" />;
      case 'house': return <Building className="w-3.5 h-3.5 text-emerald-400" />;
      default: return null;
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col h-[280px]">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 mb-2">
        <ScrollText className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Match Event Ledger
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {gameState.activityLogs.map((log) => (
          <div
            key={log.id}
            className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] leading-snug flex items-start space-x-2"
          >
            <div className="mt-0.5 shrink-0">{getLogIcon(log.type)}</div>
            <div className="flex-1">
              <span className="text-slate-300">{log.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
