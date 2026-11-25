interface FormFieldErrorProps {
  message?: string;
  id?: string;
}

export function FormFieldError({ message, id }: FormFieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="school:text-school-error text-xs text-red-600">
      {message}
    </p>
  );
}
