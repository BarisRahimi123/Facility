import * as Dialog from '@radix-ui/react-dialog';
import { X, Folder as FolderIcon } from 'lucide-react';
import { Category, Folder } from '@/types/plans';

interface MovePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (folderId: string) => void;
  categories: Category[];
}

export default function MovePlanDialog({
  isOpen,
  onClose,
  onMove,
  categories
}: MovePlanDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b">
            <Dialog.Title className="text-lg font-semibold">
              Move Plan
            </Dialog.Title>
            <Dialog.Close className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {categories.map((category) => (
              <div key={category.id} className="mb-4">
                <div className="font-medium text-gray-700 mb-2">
                  {category.name}
                </div>
                <div className="space-y-2 pl-4">
                  {category.folders?.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        onMove(folder.id);
                        onClose();
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded text-left"
                    >
                      <FolderIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{folder.name}</span>
                    </button>
                  ))}
                  {(!category.folders || category.folders.length === 0) && (
                    <div className="text-sm text-gray-500 py-2">
                      No folders in this category
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 