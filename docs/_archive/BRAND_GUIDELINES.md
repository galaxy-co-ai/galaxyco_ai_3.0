# GalaxyCo.ai Brand Guidelines

**Version:** 1.0  
**Last Updated:** December 14, 2025  
**Status:** Production Ready

---

## 🎨 Color Palette

### Primary Colors

| Name | Hex | RGB | Usage | Tailwind |
|------|-----|-----|-------|----------|
| **Void Black** | `#0D0D12` | rgb(13, 13, 18) | Primary dark background, text on light | `bg-[#0D0D12]` |
| **Deep Space** | `#19122F` | rgb(25, 18, 47) | Cards, panels, visual hierarchy | `bg-[#19122F]` |
| **Ice White** | `#F5F5F7` | rgb(245, 245, 247) | Text on dark, light backgrounds | `bg-[#F5F5F7]` |

### Accent Colors

| Name | Hex | RGB | Usage | Tailwind |
|------|-----|-----|-------|----------|
| **Electric Cyan** | `#00D4E8` | rgb(0, 212, 232) | Primary actions, links, highlights, CTAs | `bg-[#00D4E8]` |
| **Creamsicle** | `#FF9966` | rgb(255, 153, 102) | Warm accents, emphasis (use sparingly) | `bg-[#FF9966]` |

### Accessibility

All color combinations meet WCAG AAA standards:
- Ice White on Void Black: **17.8:1** ✅
- Ice White on Deep Space: **15.2:1** ✅
- Electric Cyan on Void Black: **8.1:1** ✅

---

## 🔤 Typography

### Font Stack

**Primary (Headings):** Space Grotesk  
**Secondary (Body):** Inter  
**Monospace (Code):** JetBrains Mono

### Usage

```css
/* Headings */
h1, h2, h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600-700;
}

/* Body Text */
body, p, span {
  font-family: 'Inter', sans-serif;
  font-weight: 400-500;
}

/* Code */
code, pre {
  font-family: 'JetBrains Mono', monospace;
}
```

### Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| **H1** | 3.5rem (56px) | Bold (700) | 1.1 |
| **H2** | 2.5rem (40px) | SemiBold (600) | 1.2 |
| **H3** | 1.75rem (28px) | SemiBold (600) | 1.3 |
| **Body** | 1rem (16px) | Regular (400) | 1.6 |
| **Small** | 0.875rem (14px) | Medium (500) | 1.5 |

---

## 🚀 Logo Usage

### Primary Logo (Full)

**Files:**
- `810729f1-...png` — Dark background (hero, footer)
- `1ae0cec6-...png` — Light background (nav, content)

**Minimum Size:** 120px width  
**Clear Space:** Minimum 20px padding on all sides  
**Backgrounds:** Use on solid colors only (no busy patterns)

### Logo Variations

| Variant | File | Usage |
|---------|------|-------|
| **Wordmark (Glow)** | `029fc3eb-...png` | Hero headers, dramatic sections |
| **Wordmark (Cyan)** | `4829f4ab-...png` | Light backgrounds, clean contexts |
| **Wordmark (Creamsicle)** | `89d87243-...png` | Warm sections, emphasis |
| **Icon Only** | `8e0f0c40-...png` | Favicon, app icons, mobile nav |
| **OG Image** | `og-image_1.png` | Social media previews |

### Do's ✅

- Maintain aspect ratio
- Use on solid or subtle gradient backgrounds
- Ensure sufficient contrast
- Animate exhaust glow on hover
- Scale proportionally

### Don'ts ❌

- Don't stretch or distort
- Don't use low-contrast combinations
- Don't add drop shadows
- Don't rotate or skew
- Don't use on busy backgrounds

---

## 🎯 UI Components

### Buttons

**Primary (CTA):**
```tsx
bg-[#00D4E8] text-[#0D0D12] 
hover:bg-[#00D4E8]/90 
rounded-lg px-6 py-3
font-semibold
shadow-lg shadow-[#00D4E8]/20
```

**Secondary:**
```tsx
bg-[#19122F] text-[#F5F5F7]
hover:bg-[#19122F]/80
border border-[#00D4E8]/30
rounded-lg px-6 py-3
```

**Ghost:**
```tsx
bg-transparent text-[#00D4E8]
hover:bg-[#00D4E8]/10
border border-[#00D4E8]
rounded-lg px-6 py-3
```

### Cards

```tsx
bg-[#19122F]/50 backdrop-blur-sm
border border-[#00D4E8]/20
rounded-xl p-6
shadow-lg
hover:shadow-[#00D4E8]/10
transition-all duration-300
```

### Input Fields

```tsx
bg-[#0D0D12] text-[#F5F5F7]
border border-[#00D4E8]/30
rounded-lg px-4 py-3
focus:border-[#00D4E8]
focus:ring-2 focus:ring-[#00D4E8]/20
```

### Badges

**Status:**
- Live: `bg-[#00D4E8]/10 text-[#00D4E8] border-[#00D4E8]/30`
- Beta: `bg-[#FF9966]/10 text-[#FF9966] border-[#FF9966]/30`
- Soon: `bg-gray-500/10 text-gray-400 border-gray-500/30`

---

## 🌟 Effects & Animations

### Glassmorphism

```tsx
bg-white/5 backdrop-blur-md
border border-white/10
shadow-xl
```

### Glow Effects

```tsx
/* Hover glow */
hover:shadow-lg hover:shadow-[#00D4E8]/30
transition-shadow duration-300

/* Button glow */
shadow-[#00D4E8]/20
```

### Animations

**Entrance (Fade + Scale):**
```tsx
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.5 }}
```

**Hover (Scale):**
```tsx
hover:scale-105 transition-transform duration-200
```

**Loading (Spin):**
```tsx
animate-spin // For rocket icon
```

---

## 📐 Spacing & Layout

### Container Widths

| Breakpoint | Max Width | Padding |
|------------|-----------|---------|
| Mobile | 100% | 16px |
| Tablet | 768px | 24px |
| Desktop | 1280px | 32px |
| Wide | 1536px | 40px |

### Section Padding

- **Hero:** `py-20 md:py-28`
- **Content:** `py-16 md:py-20`
- **Tight:** `py-12 md:py-16`

### Grid Systems

```tsx
/* 2-column (desktop) */
grid md:grid-cols-2 gap-6

/* 3-column (wide) */
grid lg:grid-cols-3 gap-8

/* 4-column (cards) */
grid xl:grid-cols-4 gap-6
```

---

## 🖼️ Imagery

### Photography

- Use dark, cosmic themes
- High contrast
- Minimal color grading (cyan/orange tints acceptable)
- No stock photos with people smiling at camera

### Illustrations

- Geometric, abstract
- Space/tech themes
- Match color palette
- Use sparingly as accents

### Icons

- Lucide React icon set
- 24px standard size
- Use Electric Cyan for primary icons
- Ice White for secondary icons

---

## 📝 Voice & Tone

### Brand Voice

**Characteristics:**
- **Confident** — We know our product works
- **Clear** — No buzzwords or jargon
- **Helpful** — Solutions, not problems
- **Forward-thinking** — Innovation-focused

**Not:**
- Salesy or pushy
- Corporate or stuffy
- Overly casual
- Pretentious

### Examples

✅ **Good:** "AI that works while you sleep"  
❌ **Bad:** "Leverage synergistic AI-powered solutions"

✅ **Good:** "Join 1,000+ teams automating their workflows"  
❌ **Bad:** "Revolutionary platform disrupting the industry"

---

## 🔒 Usage Rules

### Logo Protection

- Minimum clear space: 20px on all sides
- Minimum size: 120px width
- Never alter colors
- Never add effects (shadows, outlines, etc.)
- Never use old logos

### Brand Assets

All assets available at:
```
/public/assets/brand/
├── logos/        # All logo variations
├── icons/        # Brand icon library
└── elements/     # Decorative brand elements
```

### File Naming

```
brand-asset-{variant}-{background}-{size}.{ext}

Examples:
logo-full-dark-large.png
wordmark-glow-dark-medium.png
icon-app-transparent-512.png
```

---

## 📊 Templates

### Blog Post Types

1. **Tutorial** — Step-by-step guides
2. **Case Study** — Customer success stories
3. **Product Update** — Feature announcements
4. **Best Practices** — Tips and patterns
5. **Company News** — Behind-the-scenes, team updates

### Social Media

- **Twitter/X:** 1200x675px, Void Black bg, Electric Cyan accents
- **LinkedIn:** 1200x627px, Deep Space bg, wordmark center
- **Meta:** 1200x630px, gradient bg (Void Black → Deep Space)

---

## ✅ Checklist for New Designs

Before launching any design, verify:

- [ ] Colors from approved palette only
- [ ] Typography follows scale and weights
- [ ] Logo has sufficient clear space
- [ ] Contrast ratios meet WCAG AAA
- [ ] Mobile-responsive (375px min width)
- [ ] Animations are subtle (< 500ms)
- [ ] CTAs use Electric Cyan
- [ ] Text is left-aligned (not centered unless hero)
- [ ] Touch targets minimum 44x44px
- [ ] Loading states included

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-14 | Initial brand guidelines |

---

**Questions or additions?** Update this doc in `/docs/BRAND_GUIDELINES.md`
