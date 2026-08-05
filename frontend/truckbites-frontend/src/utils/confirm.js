import Swal from 'sweetalert2';

/**
 * Premium SweetAlert2 confirmation dialog themed to the TruckBites design system.
 * Resolves `true` when the user confirms, `false` when cancelled.
 */
export async function showConfirm({
  title = 'Are you sure?',
  text = '',
  icon = 'warning',
  confirmText = 'Yes, continue',
  cancelText = 'Cancel',
  danger = false,
}) {
  const result = await Swal.fire({
    title,
    text,
    icon,
    iconColor: danger ? '#DC2626' : '#C9A46A',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: danger ? '#DC2626' : '#B85C38',
    reverseButtons: true,
    background: '#FFFFFF',
    color: '#232323',
    backdrop: 'rgba(35, 35, 35, 0.35)',
  });
  return result.isConfirmed;
}

/**
 * Premium success dialog (e.g. after a completed action).
 */
export async function showSuccess({ title = 'Done!', text = '', confirmText = 'Great' }) {
  await Swal.fire({
    title,
    text,
    icon: 'success',
    iconColor: '#6F8F5B',
    confirmButtonText: confirmText,
    confirmButtonColor: '#B85C38',
    background: '#FFFFFF',
    color: '#232323',
    backdrop: 'rgba(35, 35, 35, 0.35)',
  });
}
