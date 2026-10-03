# Images

The hero section currently uses a CSS gradient + "twinkle lights" effect instead of a
photo, so the site works perfectly with zero images. If you'd like to use the candlelit
long-table photo from the original invite:

1. Save it as `images/hero.jpg` (recommended size: at least 1600px wide, landscape).
2. In `styles.css`, find `.hero-bg` and add:
   ```css
   background-image: linear-gradient(180deg, rgba(13,15,22,0.55), rgba(18,20,28,0.85)), url("images/hero.jpg");
   background-size: cover;
   background-position: center;
   ```
   (keep the existing `.twinkle` overlay and gradients, or remove them — your call)

Only use a photo you own the rights to use.
