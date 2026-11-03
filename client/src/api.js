const PROFILE_ATTEMPTS = 5;

// Retries so a page loaded while the server restarts or wakes up still fills in.
export async function fetchProfile(signal) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch('/api/profile', { signal });
      if (res.ok) return await res.json();
      throw new Error(`Profile request failed: ${res.status}`);
    } catch (err) {
      if (err.name === 'AbortError' || attempt === PROFILE_ATTEMPTS) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// Resolves to { ok: true }, or { ok: false, errors, error } for the form to display.
export async function sendMessage(values) {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  if (res.ok) return { ok: true };

  const body = await res.json().catch(() => ({}));
  return { ok: false, errors: body.errors ?? {}, error: body.error };
}
