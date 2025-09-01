import toast from 'react-hot-toast';

export const showErrorToast = (message: string) => {
  toast.error(message, {
    duration: 5000, // 5 seconds
    position: 'top-right',
    style: {
      backgroundColor: '#fee2e2', // red-100
      color: '#ef4444', // red-500
      border: '1px solid #fca5a5', // red-300
    },
    iconTheme: {
      primary: '#ef4444', // red-500
      secondary: '#fee2e2', // red-100
    },
  });
};

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 3000, // 3 seconds
    position: 'top-right',
    style: {
      backgroundColor: '#dcfce7', // green-100
      color: '#22c55e', // green-500
      border: '1px solid #86efac', // green-300
    },
    iconTheme: {
      primary: '#22c55e', // green-500
      secondary: '#dcfce7', // green-100
    },
  });
};