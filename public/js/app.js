document.addEventListener('DOMContentLoaded', () => {
  const templateSelect = document.getElementById('templateSelect');
  const emailSubject = document.getElementById('emailSubject');
  const recipientName = document.getElementById('recipientName');
  const recipientsInput = document.getElementById('recipientsInput');
  const simulateCheck = document.getElementById('simulateCheck');
  const previewFrame = document.getElementById('emailPreviewFrame');
  const refreshPreviewBtn = document.getElementById('refreshPreviewBtn');
  const campaignForm = document.getElementById('campaignForm');
  const sendBtn = document.getElementById('sendBtn');
  const logsTableBody = document.getElementById('logsTableBody');
  const clearLogsBtn = document.getElementById('clearLogsBtn');
  const deviceBtns = document.querySelectorAll('.device-btn');
  const toast = document.getElementById('toast');

  const defaultSubjects = {
    email1: '¡Te damos la bienvenida nuevamente a Workana! Descubre cómo ganar dinero trabajando remoto',
    email2: 'Oportunidad exclusiva: Seminario Web "Gana dinero trabajando remoto y en Workana"'
  };

  // Actualizar asunto al cambiar plantilla
  templateSelect.addEventListener('change', () => {
    const selected = templateSelect.value;
    emailSubject.value = defaultSubjects[selected] || '';
    updatePreview();
  });

  // Actualizar vista previa
  function updatePreview() {
    const templateId = templateSelect.value;
    const name = encodeURIComponent(recipientName.value.trim() || 'Juan Pérez');
    previewFrame.src = `/api/templates/${templateId}/preview?name=${name}&t=${Date.now()}`;
  }

  refreshPreviewBtn.addEventListener('click', updatePreview);
  recipientName.addEventListener('blur', updatePreview);

  // Selector de dispositivos (Desktop / Mobile)
  deviceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      deviceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      previewFrame.style.width = btn.dataset.width;
    });
  });

  // Mostrar Notificación Toast
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  // Enviar Campaña
  campaignForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rawEmails = recipientsInput.value
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (rawEmails.length === 0) {
      alert('Por favor ingrese al menos un destinatario');
      return;
    }

    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Despachando...';

    const payload = {
      templateId: templateSelect.value,
      subject: emailSubject.value,
      customName: recipientName.value,
      recipients: rawEmails,
      isSimulated: simulateCheck.checked
    };

    try {
      const response = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        showToast(`✅ ${data.message}`);
        appendLogs(data.results);
      } else {
        alert('Error: ' + (data.error || 'No se pudo enviar'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor.');
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Despachar Campaña';
    }
  });

  // Agregar registros a la tabla
  function appendLogs(entries) {
    if (!entries || entries.length === 0) return;
    const emptyRow = logsTableBody.querySelector('.empty-row');
    if (emptyRow) emptyRow.remove();

    entries.forEach(item => {
      const tr = document.createElement('tr');
      const timeStr = new Date(item.timestamp).toLocaleTimeString();
      const badgeClass = item.simulated ? 'status-badge simulated' : 'status-badge';

      tr.innerHTML = `
        <td>${timeStr}</td>
        <td><strong>${item.name}</strong> &lt;${item.recipient}&gt;</td>
        <td>${item.templateId.toUpperCase()}</td>
        <td>${item.subject}</td>
        <td><span class="${badgeClass}">${item.status}</span></td>
      `;
      logsTableBody.prepend(tr);
    });
  }

  // Limpiar Logs
  clearLogsBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/campaigns/history', { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    logsTableBody.innerHTML = '<tr class="empty-row"><td colspan="5">No se han realizado envíos en esta sesión.</td></tr>';
  });

  // Cargar historial inicial
  async function loadInitialHistory() {
    try {
      const res = await fetch('/api/campaigns/history');
      const history = await res.json();
      if (history && history.length > 0) {
         // La API devuelve los más recientes primero.
         // 'appendLogs' hace 'prepend' para cada elemento, lo que invierte el orden.
         // Pasamos el array invertido para mantener el orden correcto (los más recientes arriba).
         appendLogs(history.reverse());
      }
    } catch (e) {
      console.error('Error cargando historial:', e);
    }
  }

  loadInitialHistory();
});
