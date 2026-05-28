ARCH-AFRICA Project Image Folder

Place your own project images here and use them in the app by setting image_url to a relative path like:

  assets/projects/my-design.jpg

How to use:
1. Save your design image into this folder.
2. In js/projects.js, set image_url to the file path relative to the website root.
3. If you use the admin dashboard, the Image URL field can also accept the same relative path.

Example project item:
  {
    id: 0,
    title: 'Modern Family Home',
    description: 'A warm, modern residence with bright open-plan living.',
    category: 'house',
    slug: 'modern-family-home',
    image_url: 'assets/projects/modern-family-home.jpg',
    price_cents: 29000000000,
    currency: 'rwf',
  }

Example image_url values:
  assets/projects/modern-family-home.jpg
  assets/projects/luxury-beach-villa.png
  assets/projects/urban-office-tower.webp

If you prefer uploads, choose a file in the admin panel and it will be stored in /uploads/.