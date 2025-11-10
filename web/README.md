# Miras Web (Next.js)

Static-site (SSG) React rebuild of the PHP pages with shared layout and design inspired by `pricing.php` and the header of `index.php`.

## Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`

## Structure

- `app/layout.tsx` – shared header/footer and theme
- `app/pricing/page.tsx` – expanded pricing
- `app/{get-started,launch,register,claim,validate}/page.tsx` – SSG pages
- `components/Header.tsx`, `components/Footer.tsx`
- `app/globals.css` – shared styles

## Notes

- All pages are static by default (SSG).
- Update nav and content as needed; consider wiring dynamic values from contracts in a future iteration.
