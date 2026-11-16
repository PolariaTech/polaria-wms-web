/**
 * Promise.race con timeout que limpia el timer al resolver o rechazar.
 */
export async function raceConTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timerId = setTimeout(() => {
          reject(new Error(timeoutMessage));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timerId !== undefined) clearTimeout(timerId);
  }
}
