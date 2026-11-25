import { TEMPLATE_VARIABLES } from "@/lib/constants";

// onMouseDown preventDefault keeps focus (and the cursor) inside the textarea/input
export default function VariableChips({ onInsert, target = "body" }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700">
        Insert variable <span className="font-normal text-gray-500">(into {target})</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATE_VARIABLES.map((variable) => (
          <button
            key={variable}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onInsert(variable)}
            className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs text-gray-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            {variable}
          </button>
        ))}
      </div>
    </div>
  );
}
