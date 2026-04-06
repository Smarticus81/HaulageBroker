import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'flat';
    label?: string;
  };
  iconColor?: string;
  iconBg?: string;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
}: StatsCardProps) {
  const TrendIcon =
    trend?.direction === 'up'
      ? TrendingUp
      : trend?.direction === 'down'
        ? TrendingDown
        : Minus;

  const trendColor =
    trend?.direction === 'up'
      ? 'text-green-600'
      : trend?.direction === 'down'
        ? 'text-red-600'
        : 'text-slate-500';

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trendColor)}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{trend.value}%</span>
              {trend.label && (
                <span className="text-slate-400 font-normal">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
    </div>
  );
}
