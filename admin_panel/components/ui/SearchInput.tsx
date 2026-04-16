type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Поиск…",
  label,
}: SearchInputProps) {
  return (
    <div className="w-full max-w-md">
      {label ? (
        <label className="mb-1 block text-xs font-medium text-slate-600">
          {label}
        </label>
      ) : null}
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
    </div>
  );
}
