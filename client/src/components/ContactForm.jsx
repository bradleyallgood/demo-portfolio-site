import { useState } from 'react';
import { sendMessage } from '../api.js';

const empty = { name: '', email: '', company: '', message: '', website: '' };

function Field({ name, label, error, optional, as: Control = 'input', ...props }) {
  const errorId = `${name}-error`;

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
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
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

  const bind = (name) => ({
    value: values[name],
    onChange: (event) => setValues({ ...values, [name]: event.target.value }),
    error: errors[name],
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('sending');
    setErrors({});
    setFormError('');

    const fallback = 'Your message didn’t send. Please try again in a moment.';
    try {
      const result = await sendMessage(values);
      if (result.ok) {
        setValues(empty);
        setStatus('sent');
        return;
      }
      setErrors(result.errors);
      if (Object.keys(result.errors).length === 0) setFormError(result.error ?? fallback);
    } catch {
      setFormError(fallback);
    }
    setStatus('idle');
  }

  if (status === 'sent') {
    return (
      <p className="form-success" role="status">
        Thanks, your message is on its way. I’ll get back to you soon.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
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
      <Field name="message" label="Message" as="textarea" rows="6" required {...bind('message')} />

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
