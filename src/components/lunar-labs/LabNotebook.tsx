import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { BookMarked, Trash2, ExternalLink, Download } from 'lucide-react';
import { toast } from 'sonner';

interface BookmarkedItem {
  id: string;
  type: 'topic' | 'demo' | 'tip';
  title: string;
  category: string;
  date: string;
}

interface LabNotebookProps {
  bookmarks: BookmarkedItem[];
  onRemove?: (id: string) => void;
  onOpen?: (id: string, type: string) => void;
}

export function LabNotebook({ bookmarks, onRemove, onOpen }: LabNotebookProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleExport = () => {
    toast.success('Notebook exported as PDF!', {
      description: 'Check your downloads folder.'
    });
  };

  const handleRemove = (id: string) => {
    if (onRemove) {
      onRemove(id);
      toast.success('Removed from notebook');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <Card className="p-2.5 border-purple-500/20">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs">Bookmarks</h3>
        </div>
        {bookmarks.length > 0 && (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleExport}>
            <Download className="w-3 h-3" />
          </Button>
        )}
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          <BookMarked className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No bookmarks yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {bookmarks.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-1.5 bg-gray-800/50 border border-gray-700 rounded hover:border-purple-500/40 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-xs truncate">{item.title}</p>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0 h-4">
                    {item.type}
                  </Badge>
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                  {item.category}
                </div>
              </div>

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onOpen && onOpen(item.id, item.type)}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                  onClick={() => handleRemove(item.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}


    </Card>
  );
}
