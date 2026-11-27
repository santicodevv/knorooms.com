import { useState } from "react";

export function useRetainedFieldError(message?: string) {
  const [retainedMessage, setRetainedMessage] = useState(message);

  // Conserva el texto durante la salida; aria-hidden lo excluye al corregir el campo.
  if (message && message !== retainedMessage) {
    setRetainedMessage(message);
  }

  return { message: message ?? retainedMessage, visible: Boolean(message) };
}
