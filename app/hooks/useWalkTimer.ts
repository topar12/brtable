import { useState, useEffect, useCallback } from "react";

type WalkStatus = "idle" | "running" | "paused" | "stopped";

interface WalkTimerState {
  status: WalkStatus;
  startedAtMs: number | null;
  endedAtMs: number | null;
  accumulatedMs: number;
  elapsedMs: number;
}

interface WalkTimerReturn {
  status: WalkStatus;
  elapsedMs: number;
  startedAtMs: number | null;
  endedAtMs: number | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

export function useWalkTimer(): WalkTimerReturn {
  const [state, setState] = useState<WalkTimerState>({
    status: "idle",
    startedAtMs: null,
    endedAtMs: null,
    accumulatedMs: 0,
    elapsedMs: 0,
  });

  useEffect(() => {
    if (state.status !== "running" || state.startedAtMs === null) {
      return;
    }

    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        elapsedMs: prev.accumulatedMs + (Date.now() - prev.startedAtMs!),
      }));
    }, 250);

    return () => clearInterval(interval);
  }, [state.status, state.startedAtMs]);

  const start = useCallback(() => {
    if (state.status !== "idle" && state.status !== "stopped") {
      return;
    }

    setState({
      status: "running",
      startedAtMs: Date.now(),
      endedAtMs: null,
      accumulatedMs: 0,
      elapsedMs: 0,
    });
  }, [state.status]);

  const pause = useCallback(() => {
    if (state.status !== "running" || state.startedAtMs === null) {
      return;
    }

    const currentElapsedMs = Date.now() - state.startedAtMs;

    setState({
      status: "paused",
      startedAtMs: null,
      endedAtMs: null,
      accumulatedMs: state.accumulatedMs + currentElapsedMs,
      elapsedMs: state.accumulatedMs + currentElapsedMs,
    });
  }, [state.status, state.startedAtMs, state.accumulatedMs]);

  const resume = useCallback(() => {
    if (state.status !== "paused") {
      return;
    }

    setState((prev) => ({
      ...prev,
      status: "running",
      startedAtMs: Date.now(),
    }));
  }, [state.status]);

  const stop = useCallback(() => {
    if (state.status === "idle" || state.status === "stopped") {
      return;
    }

    const endedAtMs = Date.now();
    let finalElapsedMs = state.elapsedMs;

    if (state.status === "running" && state.startedAtMs !== null) {
      finalElapsedMs = state.accumulatedMs + (endedAtMs - state.startedAtMs);
    }

    setState({
      status: "stopped",
      startedAtMs: state.startedAtMs,
      endedAtMs: endedAtMs,
      accumulatedMs: finalElapsedMs,
      elapsedMs: finalElapsedMs,
    });
  }, [state.status, state.startedAtMs, state.accumulatedMs, state.elapsedMs]);

  const reset = useCallback(() => {
    setState({
      status: "idle",
      startedAtMs: null,
      endedAtMs: null,
      accumulatedMs: 0,
      elapsedMs: 0,
    });
  }, []);

  return {
    status: state.status,
    elapsedMs: state.elapsedMs,
    startedAtMs: state.startedAtMs,
    endedAtMs: state.endedAtMs,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
