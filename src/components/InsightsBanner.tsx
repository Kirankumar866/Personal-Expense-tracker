import React from 'react';
import { SmartInsight } from '../utils/analytics';
import { 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Lightbulb, 
  ChevronRight, 
  Car, 
  Bell 
} from 'lucide-react';

interface InsightsBannerProps {
  insights: SmartInsight[];
  onOpenComparisons: () => void;
  onOpenBudget: () => void;
}

export const InsightsBanner: React.FC<InsightsBannerProps> = ({
  insights,
  onOpenComparisons,
  onOpenBudget,
}) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs text-[#86868B] px-1">
        <div className="flex items-center gap-1.5 font-medium text-[#1D1D1F]">
          <Bell className="w-3.5 h-3.5 text-[#0071E3]" />
          <span>Active Intelligence & Spending Alerts</span>
        </div>
        <span>Real-time analysis</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.slice(0, 4).map((insight) => {
          const isSurge = insight.type === 'surge';
          const isWarning = insight.type === 'warning';
          const isPositive = insight.type === 'positive';
          const isTip = insight.type === 'tip';

          return (
            <div
              key={insight.id}
              className={`p-4 rounded-2xl border transition-all ${
                isSurge
                  ? 'bg-[#FF3B30]/5 border-[#FF3B30]/20'
                  : isWarning
                  ? 'bg-[#FF9500]/5 border-[#FF9500]/20'
                  : isPositive
                  ? 'bg-[#34C759]/5 border-[#34C759]/20'
                  : 'bg-[#0071E3]/5 border-[#0071E3]/20'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                  <div
                    className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isSurge
                        ? 'bg-[#FF3B30]/15 text-[#FF3B30]'
                        : isWarning
                        ? 'bg-[#FF9500]/15 text-[#FF9500]'
                        : isPositive
                        ? 'bg-[#34C759]/15 text-[#34C759]'
                        : 'bg-[#0071E3]/15 text-[#0071E3]'
                    }`}
                  >
                    {isSurge ? (
                      <Car className="w-4 h-4" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isPositive ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Lightbulb className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] break-words">
                        {insight.title}
                      </h4>
                      {insight.badge && (
                        <span className="text-[10px] sm:text-[11px] font-medium text-[#FF3B30] shrink-0">
                          · {insight.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#636366] leading-relaxed break-words">
                      {insight.description}
                    </p>
                  </div>
                </div>

                {insight.metric && (
                  <div className="shrink-0 text-right">
                    <span
                      className={`text-xs font-mono font-semibold tabular-nums px-2 py-0.5 rounded-md ${
                        isSurge
                          ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                          : isWarning
                          ? 'bg-[#FF9500]/10 text-[#FF9500]'
                          : isPositive
                          ? 'bg-[#34C759]/10 text-[#34C759]'
                          : 'bg-[#0071E3]/10 text-[#0071E3]'
                      }`}
                    >
                      {insight.metric}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
