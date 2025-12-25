'use client';

/**
 * Boards Tab Component
 * 
 * Flexible collections for organizing ideas, brainstorms, and side projects.
 * Features: Create boards, add rich content (notes/links/images), tag items, search.
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FolderKanban,
  Plus,
  Search,
  MoreVertical,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  Download,
  Trash2,
  Edit,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBoardsStorage } from '@/hooks/useBoardsStorage';
import type { Board, BoardItem, BoardItemType } from '@/types/boards';

interface BoardsTabProps {
  workspaceId: string;
}

export default function BoardsTab({ workspaceId }: BoardsTabProps) {
  const {
    boards,
    isLoading,
    error,
    createBoard,
    updateBoard,
    deleteBoard,
    addItem,
    updateItem,
    deleteItem,
    searchBoards,
    exportBoard,
    storageInfo,
  } = useBoardsStorage(workspaceId);

  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateBoardDialog, setShowCreateBoardDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showEditBoardDialog, setShowEditBoardDialog] = useState(false);

  // Create board form
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newBoardEmoji, setNewBoardEmoji] = useState('📋');

  // Add item form
  const [newItemType, setNewItemType] = useState<BoardItemType>('note');
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemTags, setNewItemTags] = useState('');

  const selectedBoard = useMemo(
    () => boards.find(b => b.id === selectedBoardId),
    [boards, selectedBoardId]
  );

  const filteredBoards = useMemo(
    () => (searchQuery ? searchBoards(searchQuery) : boards),
    [boards, searchQuery, searchBoards]
  );

  // Auto-select first board
  if (!selectedBoardId && boards.length > 0) {
    setSelectedBoardId(boards[0].id);
  }

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) {
      toast.error('Board name is required');
      return;
    }

    const board = createBoard(newBoardName, newBoardDescription || undefined, newBoardEmoji);
    setSelectedBoardId(board.id);
    setShowCreateBoardDialog(false);
    setNewBoardName('');
    setNewBoardDescription('');
    setNewBoardEmoji('📋');
    toast.success('Board created successfully');
  };

  const handleUpdateBoard = () => {
    if (!selectedBoardId) return;

    updateBoard(selectedBoardId, {
      name: newBoardName,
      description: newBoardDescription || undefined,
      emoji: newBoardEmoji,
    });

    setShowEditBoardDialog(false);
    toast.success('Board updated successfully');
  };

  const handleDeleteBoard = (boardId: string) => {
    if (confirm('Are you sure you want to delete this board? This cannot be undone.')) {
      deleteBoard(boardId);
      if (selectedBoardId === boardId) {
        setSelectedBoardId(boards[0]?.id || null);
      }
      toast.success('Board deleted');
    }
  };

  const handleAddItem = () => {
    if (!selectedBoardId) return;
    if (!newItemContent.trim()) {
      toast.error('Content is required');
      return;
    }

    const metadata = newItemType !== 'note' ? {
      title: newItemTitle || undefined,
    } : undefined;

    addItem(selectedBoardId, newItemType, newItemContent, metadata);
    setShowAddItemDialog(false);
    setNewItemContent('');
    setNewItemTitle('');
    setNewItemTags('');
    toast.success('Item added to board');
  };

  const handleDeleteItem = (itemId: string) => {
    if (!selectedBoardId) return;
    if (confirm('Delete this item?')) {
      deleteItem(selectedBoardId, itemId);
      toast.success('Item deleted');
    }
  };

  const handleExportBoard = () => {
    if (!selectedBoardId) return;
    const markdown = exportBoard(selectedBoardId);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedBoard?.name || 'board'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Board exported as markdown');
  };

  const openEditDialog = () => {
    if (!selectedBoard) return;
    setNewBoardName(selectedBoard.name);
    setNewBoardDescription(selectedBoard.description || '');
    setNewBoardEmoji(selectedBoard.emoji || '📋');
    setShowEditBoardDialog(true);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading boards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="text-center">
          <h3 className="font-semibold mb-2">Storage Error</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/* Left Sidebar: Board List */}
      <div className="lg:w-64 shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search boards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            aria-label="Search boards"
          />
          <Button
            onClick={() => setShowCreateBoardDialog(true)}
            size="icon"
            aria-label="Create new board"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-[200px]">
          {filteredBoards.length === 0 ? (
            <div className="text-center py-8">
              <FolderKanban className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No boards found' : 'No boards yet'}
              </p>
            </div>
          ) : (
            filteredBoards.map(board => (
              <button
                key={board.id}
                onClick={() => setSelectedBoardId(board.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedBoardId === board.id
                    ? 'bg-nebula-violet/10 border border-nebula-violet/20'
                    : 'hover:bg-muted'
                }`}
                aria-label={`Select board: ${board.name}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl shrink-0">{board.emoji || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{board.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {board.items.length} items
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Storage Info */}
        <div className="text-xs text-muted-foreground p-2 border-t">
          <div className="flex justify-between mb-1">
            <span>Storage</span>
            <span>{storageInfo.percentage.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-nebula-violet transition-all"
              style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Main Content: Board Items */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedBoard ? (
          <>
            {/* Board Header */}
            <div className="flex items-start justify-between mb-4 shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{selectedBoard.emoji || '📋'}</span>
                  <h3 className="font-semibold text-lg truncate">{selectedBoard.name}</h3>
                </div>
                {selectedBoard.description && (
                  <p className="text-sm text-muted-foreground">{selectedBoard.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => setShowAddItemDialog(true)}
                  size="sm"
                  aria-label="Add item to board"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Board options">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={openEditDialog}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Board
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportBoard}>
                      <Download className="h-4 w-4 mr-2" />
                      Export as Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteBoard(selectedBoard.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Board
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Board Items Grid */}
            <div className="flex-1 overflow-y-auto">
              {selectedBoard.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                  <h4 className="font-semibold mb-2">Empty Board</h4>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Start adding notes, links, or images to organize your ideas
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedBoard.items.map(item => (
                    <BoardItemCard
                      key={item.id}
                      item={item}
                      onDelete={() => handleDeleteItem(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Board Selected</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Create your first board to start organizing ideas, brainstorms, and side projects
              that emerge from your Neptune conversations.
            </p>
            <Button onClick={() => setShowCreateBoardDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Board
            </Button>
          </div>
        )}
      </div>

      {/* Create Board Dialog */}
      <Dialog open={showCreateBoardDialog} onOpenChange={setShowCreateBoardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>
              Organize your ideas into collections. Give it a name and optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Emoji</label>
              <Input
                value={newBoardEmoji}
                onChange={(e) => setNewBoardEmoji(e.target.value)}
                placeholder="📋"
                maxLength={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Name *</label>
              <Input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="New Ideas"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBoardDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBoard}>Create Board</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Board Dialog */}
      <Dialog open={showEditBoardDialog} onOpenChange={setShowEditBoardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Emoji</label>
              <Input
                value={newBoardEmoji}
                onChange={(e) => setNewBoardEmoji(e.target.value)}
                placeholder="📋"
                maxLength={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Name *</label>
              <Input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Board name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditBoardDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBoard}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
            <DialogDescription>
              Add a note, link, or image to this board
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <div className="flex gap-2">
                <Button
                  variant={newItemType === 'note' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewItemType('note')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Note
                </Button>
                <Button
                  variant={newItemType === 'link' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewItemType('link')}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Link
                </Button>
                <Button
                  variant={newItemType === 'image' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewItemType('image')}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Image
                </Button>
              </div>
            </div>
            {newItemType !== 'note' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Optional title"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {newItemType === 'note' ? 'Content *' : 'URL *'}
              </label>
              <Textarea
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                placeholder={
                  newItemType === 'note'
                    ? 'Your note content...'
                    : newItemType === 'link'
                    ? 'https://example.com'
                    : 'https://example.com/image.jpg'
                }
                rows={newItemType === 'note' ? 5 : 2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface BoardItemCardProps {
  item: BoardItem;
  onDelete: () => void;
}

function BoardItemCard({ item, onDelete }: BoardItemCardProps) {
  const getIcon = () => {
    switch (item.type) {
      case 'link':
        return LinkIcon;
      case 'image':
        return ImageIcon;
      default:
        return FileText;
    }
  };

  const Icon = getIcon();

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {item.metadata?.title && (
            <h4 className="font-semibold text-sm">{item.metadata.title}</h4>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onDelete}
          aria-label="Delete item"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {item.type === 'note' ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
          {item.content}
        </p>
      ) : item.type === 'link' ? (
        <a
          href={item.content}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-nebula-violet hover:underline break-all"
        >
          {item.content}
        </a>
      ) : (
        <img
          src={item.content}
          alt={item.metadata?.description || 'Board image'}
          className="w-full h-32 object-cover rounded-md"
        />
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {item.tags.map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        {new Date(item.createdAt).toLocaleDateString()}
      </p>
    </Card>
  );
}
