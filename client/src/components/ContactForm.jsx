import { useEffect, useRef, useState } from 'react';
import { FIELDS, MESSAGE_MAX, validateContact } from '../../../shared/contact.mjs';
import { sendMessage } from '../api.js';

const empty = { name: '', email: '', company: '', message: '', website: '' };

const firstInvalid = (errors) => FIELDS.find((name) => errors[name]);

function Field({ name, label, error, hint, optional, as: Control = 'input', ...props }) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ');

  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {optional && <span className="optional"> (optional)</span>}
      </label>
      <Control
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function ContactForm() {
  const [values, setValues] = useState(empty);
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [openedAt] = useState(() => Date.now());
  const formRef = useRef(null);
  const successRef = useRef(null);
  const focusPending = useRef(false);

  // Focus moves after the errors render, so screen readers read the field with its error.
  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    const name = firstInvalid(errors);
    if (name) formRef.current?.elements[name]?.focus();
  }, [errors]);

  // The form, and the button that had focus, are gone. Keep keyboard users in place.
  useEffect(() => {
    if (status === 'sent') successRef.current?.focus();
  }, [status]);

  function showErrors(next) {
    focusPending.current = true;
    setErrors(next);
  }

  const bind = (name) => ({
    value: values[name],
    onChange: (event) => {
      const next = { ...values, [name]: event.target.value };
      setValues(next);
      // Once a field has an error, recheck it as they type so the error clears when it's fixed.
      if (errors[name]) {
        setErrors({ ...errors, [name]: validateContact(next).errors[name] });
      }
    },
    error: errors[name],
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const local = validateContact(values).errors;
    if (firstInvalid(local)) {
      showErrors(local);
      return;
    }

    setStatus('sending');
    setErrors({});

    const fallback = 'Your message didn’t send. Please try again in a moment.';
    try {
      const result = await sendMessage({ ...values, elapsedMs: Date.now() - openedAt });
      if (result.ok) {
        setValues(empty);
        setStatus('sent');
        return;
      }
      if (firstInvalid(result.errors)) showErrors(result.errors);
      else setFormError(result.error ?? fallback);
    } catch {
      setFormError(fallback);
    }
    setStatus('idle');
  }

  if (status === 'sent') {
    return (
      <p className="form-success" role="status" tabIndex="-1" ref={successRef}>
        Thanks, your message is on its way. I’ll get back to you soon.
      </p>
    );
  }

  const length = values.message.length;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="field-row">
        <Field name="name" label="Name" autoComplete="name" required {...bind('name')} />
        <Field
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          {...bind('email')}
        />
      </div>
      <Field name="company" label="Company" autoComplete="organization" optional {...bind('company')} />
      <Field
        name="message"
        label="Message"
        as="textarea"
        rows="6"
        required
        hint={`${length.toLocaleString('en-US')} of ${MESSAGE_MAX.toLocaleString('en-US')} characters`}
        {...bind('message')}
      />

      <div className="trap" aria-hidden="true">
        <label htmlFor="website">Leave this empty</label>
        <input
          id="website"
          name="website"
          tabIndex="-1"
          autoComplete="off"
          value={values.website}
          onChange={(event) => setValues({ ...values, website: event.target.value })}
        />
      </div>

      {formError && (
        <p className="field-error" role="alert">
          {formError}
        </p>
      )}

      <button className="button" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
