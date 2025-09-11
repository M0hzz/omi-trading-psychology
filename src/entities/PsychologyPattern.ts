export interface PsychologyPattern {
  id?: string;
  pattern_type: "CIRCADIAN" | "WEEKLY" | "MARKET_CORRELATION" | "STRESS_PATTERN" | "CONFIDENCE_CYCLE";
  description: string;
  confidence: number; // 0-1
  data_points: number;
  recommendation?: string;
  trigger_conditions?: string[];
  severity: "LOW" | "MEDIUM" | "HIGH";
  trend: "IMPROVING" | "STABLE" | "DECLINING";
  created_date?: string;
  updated_date?: string;
}

export class PsychologyPatternService {
  private static storageKey = 'omi_psychology_patterns';

  static async list(sort = "-created_date", limit?: number): Promise<PsychologyPattern[]> {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(this.storageKey) : null;
    let patterns: PsychologyPattern[] = stored ? JSON.parse(stored) : this.getMockData();
    
    // Sort patterns
    if (sort === "-confidence") {
      patterns.sort((a, b) => b.confidence - a.confidence);
    } else if (sort === "-created_date") {
      patterns.sort((a, b) => new Date(b.created_date!).getTime() - new Date(a.created_date!).getTime());
    }
    
    return limit ? patterns.slice(0, limit) : patterns;
  }

  static async create(data: Omit<PsychologyPattern, 'id' | 'created_date' | 'updated_date'>): Promise<PsychologyPattern> {
    const patterns = await this.list();
    const newPattern: PsychologyPattern = {
      ...data,
      id: Date.now().toString(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    
    patterns.unshift(newPattern);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(patterns));
    }
    return newPattern;
  }

  private static getMockData(): PsychologyPattern[] {
    return [
      {
        id: "1",
        pattern_type: "CIRCADIAN",
        description: "Mood scores consistently drop between 2-4 PM, likely due to natural circadian rhythm dips. This pattern affects 73% of your afternoon trading decisions.",
        confidence: 0.87,
        data_points: 45,
        recommendation: "Schedule important trading decisions outside of 2-4 PM window. Consider brief walk or caffeine break during this time to maintain alertness.",
        trigger_conditions: ["afternoon", "post-lunch", "2pm-4pm"],
        severity: "MEDIUM",
        trend: "STABLE",
        created_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        pattern_type: "MARKET_CORRELATION",
        description: "Stress levels spike significantly during high volatility periods (VIX > 25). Your stress increases by 40% when market volatility exceeds normal ranges.",
        confidence: 0.93,
        data_points: 32,
        recommendation: "Implement pre-market meditation routine on high volatility days. Reduce position sizes when VIX exceeds 25 to maintain emotional stability.",
        trigger_conditions: ["high_volatility", "market_open", "vix_spike"],
        severity: "HIGH",
        trend: "DECLINING",
        created_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        pattern_type: "WEEKLY",
        description: "Trading confidence peaks on Tuesdays and Wednesdays (avg 8.2/10), but drops significantly on Mondays (avg 5.8/10). Weekend recovery time affects weekly performance.",
        confidence: 0.76,
        data_points: 28,
        recommendation: "Schedule complex trades for mid-week. Use Mondays for research and planning rather than execution. Consider weekend routine optimization.",
        trigger_conditions: ["monday", "week_start", "weekend_effect"],
        severity: "LOW",
        trend: "IMPROVING",
        created_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "4",
        pattern_type: "STRESS_PATTERN",
        description: "Consecutive losing trades create compounding stress effect, with stress levels increasing exponentially after the second loss. Decision quality degrades by 35%.",
        confidence: 0.91,
        data_points: 56,
        recommendation: "Implement mandatory 30-minute break after 2 consecutive losses. Consider reducing position size by 50% after 3 consecutive losses to prevent emotional spiral.",
        trigger_conditions: ["consecutive_losses", "loss_streak", "emotional_spiral"],
        severity: "HIGH",
        trend: "STABLE",
        created_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "5",
        pattern_type: "CONFIDENCE_CYCLE",
        description: "Overconfidence following winning streaks leads to larger, riskier positions. Risk tolerance increases by 60% after 3+ consecutive wins, often preceding major losses.",
        confidence: 0.82,
        data_points: 41,
        recommendation: "Set strict position size limits regardless of recent performance. Review risk management rules after every 3 consecutive wins to maintain discipline.",
        trigger_conditions: ["winning_streak", "overconfidence", "risk_escalation"],
        severity: "MEDIUM",
        trend: "IMPROVING",
        created_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "6",
        pattern_type: "STRESS_PATTERN",
        description: "Energy levels below 4/10 correlate with 67% higher error rates in trade execution. Low energy states lead to delayed decision making and missed opportunities.",
        confidence: 0.79,
        data_points: 38,
        recommendation: "Avoid active trading when energy levels drop below 4/10. Focus on market analysis and education during low-energy periods instead of live trading.",
        trigger_conditions: ["low_energy", "fatigue", "execution_errors"],
        severity: "MEDIUM",
        trend: "STABLE",
        created_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
  }
}