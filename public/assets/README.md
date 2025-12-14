# Assets Directory

Production assets for GalaxyCo.ai. These map to Canva folders for easy workflow.

## Folder Mapping

| Codebase Folder | Canva Folder | Usage |
|-----------------|--------------|-------|
| `brand/logos/` | galaxyco_logos | Header, footer, favicon, OG images |
| `brand/icons/` | galaxyco_icons | Custom iconography (not Lucide) |
| `brand/elements/` | galaxyco_brand_elements | Patterns, gradients, textures |
| `hero/` | galaxyco_hero_images | Landing page heroes, section backgrounds |
| `illustrations/` | galaxyco_illustrations | Feature graphics, empty states, onboarding |
| `screenshots/` | galaxyco_screenshots | Product screenshots for marketing |
| `blog/` | galaxyco_blog | Blog post featured images |
| `documentation/` | galaxyco_documentation | Help docs, guides, tutorials |

## Workflow

1. Design/edit in Canva
2. Export optimized version (WebP preferred, PNG fallback)
3. Drop into matching folder here
4. Reference via `/assets/[folder]/[filename]`
5. Use Next.js `<Image>` component for automatic optimization

## Naming Convention

- Lowercase, kebab-case: `hero-dashboard.webp`
- Include size variant if needed: `logo-full.svg`, `logo-icon.svg`
- Blog posts: `YYYY-MM-DD-slug.webp`
