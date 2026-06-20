import Badge from '../common/Badge';
import { SCORE_TIER_COLORS, SCORE_TIER_LABELS } from '../../utils/helpers';

export default function ScoreBadge({ tier, score, showScore = false }) {
  if (!tier) return null;
  return (
    <Badge colorClass={SCORE_TIER_COLORS[tier]}>
      {SCORE_TIER_LABELS[tier]}
      {showScore && score != null ? ` (${score})` : ''}
    </Badge>
  );
}
