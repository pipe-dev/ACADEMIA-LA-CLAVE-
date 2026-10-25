"use client";

import { usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";

// Toasts de autenticación que no deben mostrarse como alertas flotantes,
// ya que el login maneja todo su feedback visual dentro de su propia tarjeta.
const AUTH_TOAST_TITLES = new Set([
  "Acceso Concedido",
  "Error de Acceso",
  "Error",
  "Campos incompletos",
  "Acceso Bloqueado",
  "Suscripción Vencida",
  "Suscripción finalizada",
  "Cuenta suspendida",
  "Sesión expirada",
  "¡Bienvenido!",
]);

export function Toaster() {
  const pathname = usePathname();
  const { toasts } = useToast();

  // En login nunca mostramos ningún toast flotante
  if (pathname === "/login") {
    return null;
  }

  // Filtrar de forma pura sin efectos secundarios para no bloquear la navegación
  const visibleToasts = toasts.filter(
    (t) => typeof t.title !== "string" || !AUTH_TOAST_TITLES.has(t.title)
  );

  return (
    <ToastProvider>
      {visibleToasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} duration={6000} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
