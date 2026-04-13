export const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'error') => {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toastEl = document.createElement('div');
  const bgClass = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-amber-600'
  }[type];
  
  toastEl.className = `px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-white transition-opacity duration-300 opacity-0 transform translate-y-2 ${bgClass}`;
  toastEl.textContent = message;
  
  toastContainer.appendChild(toastEl);
  
  // Animate in
  requestAnimationFrame(() => {
    toastEl.style.opacity = '1';
    toastEl.style.transform = 'translateY(0)';
  });
  
  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(2px)';
    setTimeout(() => {
      toastEl.remove();
    }, 300);
  }, 3000);
};

export const showConfirm = (message: string, onConfirm: () => void | Promise<void>) => {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200';
  overlay.style.opacity = '0';
  
  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-2xl max-w-md w-full p-6 shadow-xl transform scale-95 transition-transform duration-200';
  
  const title = document.createElement('h3');
  title.className = 'text-xl font-bold text-slate-900 mb-2';
  title.textContent = 'Confirm Action';
  
  const text = document.createElement('p');
  text.className = 'text-slate-600 mb-6';
  text.textContent = message;
  
  const btnContainer = document.createElement('div');
  btnContainer.className = 'flex justify-end gap-3';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors';
  cancelBtn.textContent = 'Cancel';
  
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2';
  confirmBtn.textContent = 'Confirm';

  const closeModal = () => {
    overlay.style.opacity = '0';
    modal.style.transform = 'scale(95%)';
    setTimeout(() => overlay.remove(), 200);
  };

  cancelBtn.onclick = closeModal;
  
  confirmBtn.onclick = async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing...';
    try {
      await onConfirm();
      closeModal();
    } catch (error) {
      console.error("Confirm action failed:", error);
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm';
      showToast("Action failed. Please try again.", "error");
    }
  };
  
  btnContainer.appendChild(cancelBtn);
  btnContainer.appendChild(confirmBtn);
  
  modal.appendChild(title);
  modal.appendChild(text);
  modal.appendChild(btnContainer);
  overlay.appendChild(modal);
  
  document.body.appendChild(overlay);
  
  // Animate in
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    modal.style.transform = 'scale(100%)';
  });
};
