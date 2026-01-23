import { BURNOUT_CONFIG } from '@/config/studySystem';

export interface EnergyLog {
  date: Date;
  studyHours: number;
  questionsAttempted: number;
  accuracy: number;
  lateNightStudy: boolean;
}

export interface BurnoutSignal {
  type: 'accuracy_drop' | 'time_decrease' | 'night_study' | 'incomplete_targets';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export function calculateEnergyScore(logs: EnergyLog[]): number {
  if (logs.length === 0) return 100;
  
  const recentLogs = logs.slice(-7); // Last 7 days
  let score = 100;
  
  // Check for declining accuracy
  const accuracies = recentLogs.map(l => l.accuracy);
  const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  const recentAccuracy = accuracies.slice(-3).reduce((a, b) => a + b, 0) / 3;
  
  if (recentAccuracy < avgAccuracy - 10) score -= 15;
  if (recentAccuracy < avgAccuracy - 20) score -= 25;
  
  // Check for decreasing study time
  const studyTimes = recentLogs.map(l => l.studyHours);
  const avgStudyTime = studyTimes.reduce((a, b) => a + b, 0) / studyTimes.length;
  const recentStudyTime = studyTimes.slice(-3).reduce((a, b) => a + b, 0) / 3;
  
  if (recentStudyTime < avgStudyTime * 0.7) score -= 20;
  
  // Check for late night studying
  const lateNightDays = recentLogs.filter(l => l.lateNightStudy).length;
  if (lateNightDays >= 4) score -= 15;
  
  // Check for low question attempts
  const avgQuestions = recentLogs.reduce((sum, l) => sum + l.questionsAttempted, 0) / recentLogs.length;
  if (avgQuestions < 20) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

export function detectBurnoutSignals(logs: EnergyLog[]): BurnoutSignal[] {
  const signals: BurnoutSignal[] = [];
  
  if (logs.length < 3) return signals;
  
  const recentLogs = logs.slice(-7);
  
  // Accuracy drop
  const accuracies = recentLogs.map(l => l.accuracy);
  const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  const last3Accuracy = accuracies.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const accuracyDrop = avgAccuracy - last3Accuracy;
  
  if (accuracyDrop >= Math.abs(BURNOUT_CONFIG.SIGNALS.accuracy_drop)) {
    signals.push({
      type: 'accuracy_drop',
      severity: accuracyDrop > 25 ? 'high' : 'medium',
      message: `Your accuracy dropped by ${accuracyDrop.toFixed(1)}% in last 3 days`
    });
  }
  
  // Study time decrease
  const studyTimes = recentLogs.map(l => l.studyHours);
  const avgStudyTime = studyTimes.reduce((a, b) => a + b, 0) / studyTimes.length;
  const last3StudyTime = studyTimes.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const timeDecrease = ((avgStudyTime - last3StudyTime) / avgStudyTime) * 100;
  
  if (timeDecrease >= Math.abs(BURNOUT_CONFIG.SIGNALS.time_decrease)) {
    signals.push({
      type: 'time_decrease',
      severity: timeDecrease > 40 ? 'high' : 'medium',
      message: `Study time decreased by ${timeDecrease.toFixed(0)}%`
    });
  }
  
  // Late night study pattern
  const lateNightDays = recentLogs.filter(l => l.lateNightStudy).length;
  if (lateNightDays >= 5) {
    signals.push({
      type: 'night_study',
      severity: 'high',
      message: `You studied late night on ${lateNightDays} days this week`
    });
  }
  
  // Incomplete targets
  const avgQuestions = recentLogs.reduce((sum, l) => sum + l.questionsAttempted, 0) / recentLogs.length;
  if (avgQuestions < 15) {
    signals.push({
      type: 'incomplete_targets',
      severity: avgQuestions < 10 ? 'high' : 'medium',
      message: `Daily target completion is low (${avgQuestions.toFixed(0)}/30 questions)`
    });
  }
  
  return signals;
}

export function shouldSuggestRest(energyScore: number, signals: BurnoutSignal[]): boolean {
  const highSeveritySignals = signals.filter(s => s.severity === 'high').length;
  
  return (
    energyScore < BURNOUT_CONFIG.REST_DAY_THRESHOLD ||
    highSeveritySignals >= 2
  );
}

export function getRestDayMessage(energyScore: number): string {
  if (energyScore < 20) {
    return "🛑 Critical: Take a complete break today. Your brain needs recovery!";
  } else if (energyScore < 40) {
    return "⚠️ Warning: Consider a light study day or half-day break.";
  } else if (energyScore < 60) {
    return "💡 Suggestion: Focus on easier topics or just revisions today.";
  }
  return "✅ You're doing great! Keep up the momentum.";
}
