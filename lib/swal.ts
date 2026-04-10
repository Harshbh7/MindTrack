import Swal from 'sweetalert2';

export const MindSwal = Swal.mixin({
  background: '#111827', // Gray-900
  color: '#fff',
  confirmButtonColor: '#9333ea', // Purple-600
  cancelButtonColor: '#374151', // Gray-700
  customClass: {
    popup: 'rounded-2xl border border-gray-800 shadow-2xl',
    confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
    cancelButton: 'rounded-xl px-6 py-2.5 font-bold'
  }
});

export const Toast = MindSwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});
