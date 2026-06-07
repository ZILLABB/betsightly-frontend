import { useCallback } from 'react';
import { usePreferences } from './usePreferences';
import { formatOdds } from '../utils/formatters';
import type { OddsFormat } from '../contexts/PreferencesTypes';

export function useFormatOdds() {
  const { preferences } = usePreferences();
  const fmt = preferences.oddsFormat as OddsFormat;

  const fo = useCallback(
    (odds: number) => formatOdds(odds, fmt),
    [fmt]
  );

  const suffix = fmt === 'decimal' ? 'x' : '';

  return { formatOdds: fo, oddsSuffix: suffix, oddsFormat: fmt };
}
