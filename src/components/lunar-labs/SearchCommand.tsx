import { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Badge } from '../ui/badge';
import { Search, FileText, Play, Lightbulb, Clock } from 'lucide-react';
import { topics, searchSuggestions } from '../../data/lunarLabsContent';

interface SearchCommandProps {
  onSelectResult: (topicId: string, demoId?: string) => void;
}

interface SearchResult {
  id: string;
  type: 'topic' | 'demo' | 'faq';
  title: string;
  description: string;
  topicId: string;
  demoId?: string;
  category: string;
}

export function SearchCommand({ onSelectResult }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    // Keyboard shortcut
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (!search) {
      setResults([]);
      return;
    }

    const searchLower = search.toLowerCase();
    const newResults: SearchResult[] = [];

    // Search through topics
    topics.forEach((topic) => {
      if (
        topic.title.toLowerCase().includes(searchLower) ||
        topic.description.toLowerCase().includes(searchLower) ||
        topic.tags.some(tag => tag.toLowerCase().includes(searchLower))
      ) {
        newResults.push({
          id: topic.id,
          type: 'topic',
          title: topic.title,
          description: topic.description,
          topicId: topic.id,
          category: topic.category
        });
      }

      // Search through demos
      topic.sections.forEach((section) => {
        if (section.demo) {
          if (
            section.demo.title.toLowerCase().includes(searchLower) ||
            section.demo.description.toLowerCase().includes(searchLower)
          ) {
            newResults.push({
              id: `${topic.id}-${section.demo.id}`,
              type: 'demo',
              title: section.demo.title,
              description: section.demo.description,
              topicId: topic.id,
              demoId: section.demo.id,
              category: topic.category
            });
          }
        }

        // Search through FAQs
        if (section.faqs) {
          section.faqs.forEach((faq, index) => {
            if (
              faq.question.toLowerCase().includes(searchLower) ||
              faq.answer.toLowerCase().includes(searchLower)
            ) {
              newResults.push({
                id: `${topic.id}-faq-${index}`,
                type: 'faq',
                title: faq.question,
                description: faq.answer.substring(0, 100) + '...',
                topicId: topic.id,
                category: topic.category
              });
            }
          });
        }
      });
    });

    setResults(newResults.slice(0, 10));
  }, [search]);

  const handleSelect = (result: SearchResult) => {
    onSelectResult(result.topicId, result.demoId);
    setOpen(false);
    setSearch('');
  };

  const typeIcons = {
    topic: FileText,
    demo: Play,
    faq: Lightbulb
  };

  return (
    <div className="relative">
      <div 
        className="relative cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder='Search Lunar Labs... (⌘K)'
          className="w-full h-9 pl-10 pr-4 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (search || true) && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full mt-2 w-full z-50">
            <Command className="rounded-xl border border-gray-200 shadow-2xl bg-white overflow-hidden">
              <CommandList className="max-h-[400px]">
                {!search && (
                  <CommandGroup heading="Quick Suggestions" className="p-2">
                    {searchSuggestions.slice(0, 5).map((suggestion, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => setSearch(suggestion)}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg hover:bg-purple-50 text-gray-700 data-[selected=true]:bg-purple-50"
                      >
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{suggestion}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {search && results.length === 0 && (
                  <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                    No results found for "{search}"
                  </CommandEmpty>
                )}

                {search && results.length > 0 && (
                  <>
                    <CommandGroup heading="Topics" className="p-2">
                      {results.filter(r => r.type === 'topic').map((result) => {
                        const Icon = typeIcons[result.type];
                        return (
                          <CommandItem
                            key={result.id}
                            onSelect={() => handleSelect(result)}
                            className="flex items-start gap-3 px-3 py-2.5 cursor-pointer rounded-lg hover:bg-purple-50 data-[selected=true]:bg-purple-50"
                          >
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-gray-900">{result.title}</span>
                                <Badge variant="outline" className="text-xs capitalize border-gray-200 text-gray-600">
                                  {result.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2">{result.description}</p>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>

                    {results.filter(r => r.type === 'demo').length > 0 && (
                      <CommandGroup heading="Demos" className="p-2">
                        {results.filter(r => r.type === 'demo').map((result) => {
                          const Icon = typeIcons[result.type];
                          return (
                            <CommandItem
                              key={result.id}
                              onSelect={() => handleSelect(result)}
                              className="flex items-start gap-3 px-3 py-2.5 cursor-pointer rounded-lg hover:bg-blue-50 data-[selected=true]:bg-blue-50"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm text-gray-900">{result.title}</span>
                                  <Badge variant="outline" className="text-xs capitalize border-gray-200 text-gray-600">
                                    {result.type}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">{result.description}</p>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}

                    {results.filter(r => r.type === 'faq').length > 0 && (
                      <CommandGroup heading="FAQs" className="p-2">
                        {results.filter(r => r.type === 'faq').map((result) => {
                          const Icon = typeIcons[result.type];
                          return (
                            <CommandItem
                              key={result.id}
                              onSelect={() => handleSelect(result)}
                              className="flex items-start gap-3 px-3 py-2.5 cursor-pointer rounded-lg hover:bg-green-50 data-[selected=true]:bg-green-50"
                            >
                              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm text-gray-900">{result.title}</span>
                                  <Badge variant="outline" className="text-xs capitalize border-gray-200 text-gray-600">
                                    {result.type}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">{result.description}</p>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </div>
        </>
      )}
    </div>
  );
}
