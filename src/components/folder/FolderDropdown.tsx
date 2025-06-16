'use client';

interface FolderDropdownProps {
  isOpen: boolean;
  onNewPlan: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export default function FolderDropdown({
  isOpen,
  onNewPlan,
  onRename,
  onDelete
}: FolderDropdownProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-1 w-[200px] bg-white rounded-lg shadow-lg border border-[#E9ECEF] z-50">
      <button
        onClick={onNewPlan}
        className="w-full text-left px-4 py-2.5 text-sm text-[#333333] hover:bg-[#F8F9FA] border-b border-[#E9ECEF]"
      >
        New plan
      </button>
      <button
        onClick={onRename}
        className="w-full text-left px-4 py-2.5 text-sm text-[#333333] hover:bg-[#F8F9FA] border-b border-[#E9ECEF]"
      >
        Rename folder
      </button>
      <button
        onClick={onDelete}
        className="w-full text-left px-4 py-2.5 text-sm text-[#DC3545] hover:bg-[#F8F9FA]"
      >
        Delete folder
      </button>
    </div>
  );
} 