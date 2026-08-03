export default function LoadingSpinner({ size, className, text }) {
  if (size === undefined) size = 'md';
  if (className === undefined) className = '';
  if (text === undefined) text = '';
  var sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-[3px]',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div className={'flex flex-col items-center justify-center ' + className}>
      <div className="relative">
        <div className={sizeClasses[size] + ' rounded-full border-line'} />
        <div className={'absolute top-0 left-0 ' + sizeClasses[size] + ' rounded-full border-primary border-t-transparent animate-spin'} />
      </div>
      {text && (
        <p className="mt-3 text-sm text-body animate-pulse">{text}</p>
      )}
    </div>
  );
}
