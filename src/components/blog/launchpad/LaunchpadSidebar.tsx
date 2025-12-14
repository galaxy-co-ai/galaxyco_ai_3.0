import Link from 'next/link';
import { TrendingUp, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TrendingPost {
  id: string;
  title: string;
  slug: string;
  categoryName: string | null;
  categoryColor: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
}

interface LaunchpadSidebarProps {
  trending: TrendingPost[];
  categories: Category[];
  hasContent: boolean;
}

export function LaunchpadSidebar({ trending, categories, hasContent }: LaunchpadSidebarProps) {
  return (
    <aside className="space-y-8">
      {/* Trending This Week */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded-lg bg-green-500/10">
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold">Trending</h3>
        </div>
        <Card className="shadow-soft">
          <CardContent className="py-2 px-0">
            <div className="divide-y">
              {trending.map((post, index) => (
                <Link 
                  key={post.id} 
                  href={hasContent ? `/launchpad/${post.slug}` : '#'}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                    hasContent ? 'hover:bg-muted/50' : 'cursor-default opacity-75'
                  }`}
                >
                  <span className="text-base font-bold text-muted-foreground/40 w-5 shrink-0 tabular-nums">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug line-clamp-2">
                      {post.title}
                    </p>
                    {post.categoryName && (
                      <span 
                        className="text-xs mt-1 inline-block"
                        style={{ color: post.categoryColor || undefined }}
                      >
                        {post.categoryName}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browse by Topic */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Browse by Topic</h3>
        <div className="space-y-2">
          {categories.slice(0, 6).map((category) => (
            <Link 
              key={category.id} 
              href={hasContent ? `/launchpad/category/${category.slug}` : '#'}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                hasContent ? 'hover:bg-muted/50 hover:border-primary/20 hover:shadow-soft' : 'opacity-75 cursor-default'
              }`}
            >
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${category.color}12` }}
              >
                <BookOpen 
                  className="h-4 w-4" 
                  style={{ color: category.color || undefined }} 
                />
              </div>
              <div>
                <p className="text-sm font-medium">{category.name}</p>
                {category.description && (
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}

