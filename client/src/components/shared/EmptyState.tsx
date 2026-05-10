export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 gap-3">
      {icon && <span className="text-4xl">{icon}</span>}
      <h3 className="text-base font-medium text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400 text-center">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 px-5 py-2 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary-light transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
