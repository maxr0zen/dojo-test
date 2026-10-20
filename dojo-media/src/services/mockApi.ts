export type ProjectId = "briskly" | "trade" | "gostiny";

/** Replace this adapter when project destinations become available.
 * No requests or personal data leave the browser. Figma routes all cards to contacts.
 * ?mock=error enables the deterministic failure state for local QA.
 */
export async function resolveProjectDestination(
  _project: ProjectId,
): Promise<string> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 350));
  if (new URLSearchParams(window.location.search).get("mock") === "error") {
    throw new Error("Демонстрационная ошибка. Попробуйте ещё раз.");
  }
  return "#contacts";
}
