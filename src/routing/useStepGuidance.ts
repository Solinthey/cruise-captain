import { useEffect, useState } from 'react';
import { TurnStep } from './directions';
import { distanceMeters, LatLng } from './geo';
import { ARRIVAL_RADIUS_METERS, OFF_ROUTE_SKIP_MARGIN_METERS } from './useLiveNavigation';

export interface StepGuidanceState {
  currentStep: TurnStep | null;
  distanceToStepMeters: number | null;
}

// Finer-grained sibling to useLiveNavigation's pin-tracking, driving the
// banner text off Google's own turn-by-turn steps (e.g. "Turn right onto
// Stoller Rd") instead of jumping straight from pin to pin. Deliberately
// independent of the pin-level target/off-route logic in useLiveNavigation —
// that one still owns arrival/reroute-skip advancement (and is what offline
// mode falls back to, since there are no steps without a Directions API
// call). This hook only decides what to *display* while online; it uses the
// same "closer to next than current" trick to skip a step the driver drove
// past without the two systems needing to be wired together — each just
// reacts to live position independently and catches up on its own.
export function useStepGuidance(
  steps: TurnStep[],
  currentPosition: LatLng | null,
): StepGuidanceState {
  const [stepIndex, setStepIndex] = useState(0);

  // Steps are refetched (new array identity) whenever the route or its
  // road-snapped path changes — start over from the beginning each time.
  useEffect(() => {
    setStepIndex(0);
  }, [steps]);

  const currentStep = stepIndex < steps.length ? steps[stepIndex] : null;
  const nextStep =
    stepIndex + 1 < steps.length ? steps[stepIndex + 1] : null;

  const distanceToStepMeters =
    currentPosition && currentStep
      ? distanceMeters(currentPosition, currentStep.end)
      : null;
  const distanceToNextStepMeters =
    currentPosition && nextStep
      ? distanceMeters(currentPosition, nextStep.end)
      : null;

  useEffect(() => {
    if (distanceToStepMeters === null) {
      return;
    }
    if (distanceToStepMeters <= ARRIVAL_RADIUS_METERS) {
      setStepIndex(i => Math.min(i + 1, steps.length));
      return;
    }
    if (
      distanceToNextStepMeters !== null &&
      distanceToNextStepMeters + OFF_ROUTE_SKIP_MARGIN_METERS < distanceToStepMeters
    ) {
      setStepIndex(i => Math.min(i + 1, steps.length));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distanceToStepMeters, distanceToNextStepMeters]);

  return { currentStep, distanceToStepMeters };
}
