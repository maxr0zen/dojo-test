import { useEffect, useRef, useState, type FormEvent } from "react";
import { CONTACT_HREF } from "./services/actions";
import "./contact-dialog.css";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return "+7" + digits;
  if (digits.length === 11 && /^[78]/.test(digits)) return "+7" + digits.slice(1);
  return null;
}

export function ContactDialog({ open, onClose, opener }: { open: boolean; onClose: () => void; opener: HTMLElement | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const phoneInput = useRef<HTMLInputElement>(null);
  const backdropDown = useRef(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const previousFocus = opener || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const savedOverflow = document.body.style.overflow;
    const savedPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar + "px";
    document.body.style.overflow = "hidden";
    setDraft("");
    setErrors({});
    element.showModal();
    nameInput.current?.focus({ preventScroll: true });
    return () => {
      element.close();
      document.body.style.overflow = savedOverflow;
      document.body.style.paddingRight = savedPadding;
      if (previousFocus?.isConnected && previousFocus.getClientRects().length && !previousFocus.closest("[inert]")) previousFocus.focus({ preventScroll: true });
      else document.querySelector<HTMLButtonElement>(".menu-toggle")?.focus({ preventScroll: true });
    };
  }, [open, opener]);

  const prepareRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = fullName.trim().replace(/\s+/g, " ");
    const normalized = normalizePhone(phone);
    const next: typeof errors = {};
    if (!/^[\p{L}][\p{L}\p{M} '\u2019-]*$/u.test(name) || name.split(" ").length < 2)
      next.fullName = "Укажите фамилию и имя. Отчество — если есть.";
    if (!normalized || /[^\d+()\s.\-]/.test(phone))
      next.phone = "Введите номер целиком, например +7 (999) 123-45-67.";
    setErrors(next);
    if (next.fullName || next.phone) {
      (next.fullName ? nameInput : phoneInput).current?.focus();
      return;
    }
    const body = "Здравствуйте! Хочу обсудить проект.\n\nФИО: " + name + "\nТелефон: " + normalized;
    setDraft(CONTACT_HREF + "?subject=" + encodeURIComponent("Обсудить проект — Додзё Медиа") + "&body=" + encodeURIComponent(body));
  };

  return (
    <dialog
      className="contact-dialog"
      ref={dialog}
      aria-labelledby="request-title"
      aria-describedby="request-description"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), a[href]")].filter((element) => element.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onPointerDown={(event) => { backdropDown.current = event.target === event.currentTarget && outside(event.clientX, event.clientY); }}
      onClick={(event) => { if (backdropDown.current && event.target === event.currentTarget && outside(event.clientX, event.clientY)) onClose(); backdropDown.current = false; }}
    >
      <button className="request-close" type="button" onClick={onClose} aria-label="Закрыть форму заявки">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      <h2 id="request-title">Обсудим проект</h2>
      <p id="request-description">Начнём со знакомства. Расскажите, как к вам обращаться и по какому номеру связаться.</p>
      <form onSubmit={prepareRequest} noValidate>
        <div className="request-field">
          <label htmlFor="request-name">Фамилия, имя и отчество</label>
          <input ref={nameInput} id="request-name" name="fullName" autoComplete="name" placeholder="Иванов Иван Иванович" maxLength={120} required value={fullName} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? "request-name-error" : undefined}
            onChange={(event) => { setFullName(event.target.value); setErrors((value) => ({...value,fullName:undefined})); setDraft(""); }} />
          {errors.fullName && <p className="request-error" role="alert" id="request-name-error">{errors.fullName}</p>}
        </div>
        <div className="request-field">
          <label htmlFor="request-phone">Номер телефона</label>
          <input ref={phoneInput} id="request-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 (999) 123-45-67" maxLength={24} required value={phone} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "request-phone-error" : undefined}
            onChange={(event) => { setPhone(event.target.value); setErrors((value) => ({...value,phone:undefined})); setDraft(""); }} />
          {errors.phone && <p className="request-error" role="alert" id="request-phone-error">{errors.phone}</p>}
        </div>
        {draft ? (
          <div className="request-ready" role="status">
            <p>Письмо готово. Отправьте его из вашей почты — имя и телефон уже будут внутри.</p>
            <a className="request-submit" href={draft}>Открыть почту <span aria-hidden="true">→</span></a>
          </div>
        ) : (
          <button className="request-submit" type="submit">Подготовить заявку <span aria-hidden="true">→</span></button>
        )}
        <p className="request-note">Контакты попадут в письмо для hello@dojo-media.com. До отправки письма данные остаются только в этой форме.</p>
      </form>
    </dialog>
  );

  function outside(x: number, y: number) {
    const rect = dialog.current!.getBoundingClientRect();
    return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
  }
}
