# AI Social Network

A social network platform for sharing AI-generated images, built with Next.js, Tailwind CSS, Shadcn/UI, and Supabase.

## Features

- 🎨 AI Image Generation with DALL-E
- 🔐 Authentication with Supabase
- 📱 Responsive Design
- 🖼️ Image Gallery
- 👤 User Profiles
- 🔄 Real-time Updates

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn/UI
- Supabase
- OpenAI API

## Getting Started

1. Clone the repository:

```bash
git clone [your-repo-url]
cd ai-social-network
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Database Schema

The application uses Supabase with the following tables:

- `profiles`: User profiles
- `posts`: AI-generated image posts
- `follows`: User follow relationships

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
