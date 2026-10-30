import { useEffect, useMemo, useReducer } from 'react';
import {
  EncounterAction,
  EncounterInit,
  EncounterState,
  createEncounter,
  encounterReducer,
} from '@/state/encounter';
import { encounterStorage } from '@/utils/encounterStorage';

/**
 * The live encounter for a combat block, restored from storage on mount and
 * written back on every applied change.
 *
 * Deliberately synchronous: the states are small and a lost write on tab close
 * is exactly the failure this exists to prevent.
 */
export function useEncounter(init: EncounterInit) {
  const [state, dispatch] = useReducer(
    encounterReducer,
    init,
    (i): EncounterState => encounterStorage.load(i.blockId) ?? createEncounter(i),
  );

  useEffect(() => {
    encounterStorage.save(state);
  }, [state]);

  const actions = useMemo(
    () => ({
      reset: () => dispatch({ type: 'encounter.reset', init }),
    }),
    // `init` is derived from module data; blockId is the identity that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [init.blockId],
  );

  return { state, dispatch: dispatch as (action: EncounterAction) => void, ...actions };
}
