# Design Guidelines: Página de Boas-Vindas Simples

## Design Approach
**Minimalist Centered Layout** - Single-purpose welcome screen with focus on the message itself.

## Core Design Elements

### A. Color Palette
**Dark Mode:**
- Background: 222 15% 8%
- Text: 0 0% 95%

**Light Mode:**
- Background: 0 0% 98%
- Text: 222 15% 15%

### B. Typography
- Font Family: System font stack (sans-serif)
- Welcome Text: text-4xl md:text-5xl lg:text-6xl font-light
- Letter spacing: tracking-tight

### C. Layout System
- Spacing units: p-4, h-screen
- Centered: flex items-center justify-center
- Full viewport height centering

### D. Component Structure
**Single Welcome Component:**
- Full-screen centered container (min-h-screen)
- Welcome message "Seja bem-vindo" as single h1 element
- No navigation, no footer, no additional sections
- Subtle fade-in animation (animate-in fade-in duration-700)

### E. Responsive Behavior
- Mobile: text-4xl, p-4
- Tablet: text-5xl
- Desktop: text-6xl
- Maintains center alignment at all breakpoints

## Implementation Notes
- No images required
- No hero section needed
- No multi-column layouts
- No additional UI components
- Maximum simplicity: background + centered text only