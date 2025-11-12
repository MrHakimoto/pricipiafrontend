"use client";

// Define as props para permitir customização de tamanho
type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
};

export const Spinner = ({ size = 'md' }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-4',
  };

  return (
    <div
      className={`
        rounded-full animate-spin 
        border-gray-400 border-t-transparent 
        ${sizeClasses[size]}
      `}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
};