export type TaskSaveResult = boolean | "CANCELLED";

export function taskSaveWasCancelled(result: TaskSaveResult): boolean {
  return result === "CANCELLED";
}

export function taskSaveSucceeded(result: TaskSaveResult): boolean {
  return result === true;
}
