async function loadSession() {
  const status = document.getElementById('status');
  const identity = document.getElementById('identity');
  const actions = document.getElementById('actions');
  const flow = document.getElementById('flow');

  const params = new URLSearchParams(window.location.search);
  const flowParam = params.get('flow');

  if (flowParam) {
    flow.textContent =
      flowParam === 'sp-initiated'
        ? 'Login flow demonstrated: SP-initiated'
        : 'Login flow demonstrated: IdP-initiated';
  }

  try {
    const response = await fetch('/api/me', {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      status.textContent = 'Not logged in.';
      return;
    }

    const data = await response.json();

    status.textContent = 'Logged in successfully.';
    identity.hidden = false;
    actions.hidden = false;

    identity.textContent = [
      `Logged in as: ${data.user.email || '(no email claim)'}`,
      `Name: ${data.user.name || '(not provided)'}`,
      `NameID: ${data.user.nameID || '(not provided)'}`,
      `Issuer: ${data.user.issuer || '(not provided)'}`,
      `Assertion ID: ${data.user.assertionId || '(not provided)'}`
    ].join('\n');
  } catch (error) {
    status.textContent = `Unable to load session: ${error.message}`;
  }
}

loadSession();
