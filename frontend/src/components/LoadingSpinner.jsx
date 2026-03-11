export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-3 border-primary-light border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-gray-400 font-medium">Carregando...</span>
    </div>
  );
}
