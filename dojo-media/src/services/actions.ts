import { resolveProjectDestination, type ProjectId } from "./mockApi";

export const CONTACT_HREF = "mailto:hello@dojo-media.com";

export async function openProject(project: ProjectId) {
  const destination = await resolveProjectDestination(project);
  document.querySelector(destination)?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
  window.history.replaceState(null, "", destination);
  // Move keyboard focus along with the navigation, without scrolling a second time.
  document
    .querySelector<HTMLElement>(`${destination} h2`)
    ?.focus({ preventScroll: true });
}
