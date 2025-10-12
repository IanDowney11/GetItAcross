# Supabase Setup Guide for Get It Across

This guide will help you set up Supabase authentication and leaderboard functionality for your chicken crossing game.

## 🚀 Quick Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up for a free account
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `get-it-across` (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your users
5. Click "Create new project"
6. Wait for the project to be created (takes ~2 minutes)

### Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 3: Configure Your Game

1. Open `src/supabase.js` in your game files
2. Replace the placeholder values:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Project URL
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Anon key
   ```

   Example:
   ```javascript
   const SUPABASE_URL = 'https://abcdefgh.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTc3MDk2MDB9.example';
   ```

### Step 4: Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the `database-schema.sql` file from your project
3. Copy all the SQL code and paste it into the SQL Editor
4. Click **Run** to execute the schema
5. You should see "Success. No rows returned" - this means it worked!

### Step 5: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Auth Settings**, configure:
   - **Site URL**: Your deployed game URL (e.g., `https://your-game.vercel.app`)
   - **Redirect URLs**: Add your game URL to allowed redirects
3. Under **Email Templates**, you can customize the signup/reset emails (optional)

### Step 6: Test Your Setup

1. Deploy your game or run it locally
2. Try creating an account and signing in
3. Play the game and submit a score
4. Check the leaderboard to see if scores appear

## 🔧 Advanced Configuration

### Environment Variables (Recommended for Production)

Instead of hardcoding credentials, you can use environment variables:

1. Create a `.env` file in your project root:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Update `src/supabase.js`:
   ```javascript
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
   ```

3. Add `.env` to your `.gitignore` file

### Row Level Security (RLS)

The database schema automatically enables RLS with these policies:
- ✅ Anyone can read leaderboard entries
- ✅ Authenticated users can insert their own scores
- ✅ Users can only modify their own entries

### Database Schema Overview

The setup creates:
- **`leaderboard` table**: Stores all game scores
- **Indexes**: For fast queries on score, user, and level
- **Views**: `leaderboard_stats` with rankings
- **Functions**: Helper functions for leaderboard queries

## 📊 Managing the Leaderboard

### View Leaderboard Data

1. Go to **Table Editor** → **leaderboard**
2. See all submitted scores
3. You can manually edit or delete entries if needed

### Database Functions

The schema includes helpful functions:
- `get_leaderboard(limit, offset, level_filter)`: Get paginated leaderboard
- `get_user_best_score(user_id)`: Get user's highest score
- `get_global_stats()`: Get overall game statistics

### Sample Queries

Get top 10 scores:
```sql
SELECT * FROM get_leaderboard(10, 0, NULL);
```

Get level 3 leaderboard:
```sql
SELECT * FROM get_leaderboard(10, 0, 3);
```

Get game statistics:
```sql
SELECT * FROM get_global_stats();
```

## 🚨 Troubleshooting

### Common Issues

**"Authentication not available"**
- Check that SUPABASE_URL and SUPABASE_ANON_KEY are set correctly
- Verify your Supabase project is active

**"Failed to submit score"**
- Ensure the database schema has been applied
- Check that RLS policies are enabled
- Verify the user is authenticated

**"Leaderboard not loading"**
- Check browser console for errors
- Verify database tables exist
- Ensure Supabase project is not paused (free tier pauses after 1 week of inactivity)

**Users can't sign up**
- Check email confirmation settings in Auth settings
- Verify Site URL is set correctly
- Check spam folder for confirmation emails

### Testing Locally

To test authentication locally:
1. Set Site URL to `http://localhost:3000` (or your local port)
2. Add `http://localhost:3000` to redirect URLs
3. Remember to update these for production deployment!

### Production Deployment

For Vercel deployment:
1. Add environment variables in Vercel dashboard
2. Set Site URL to your Vercel app URL
3. Update redirect URLs accordingly

## 💡 Optional Enhancements

### Email Customization
- Customize signup/reset email templates in Auth → Settings
- Add your game logo and branding

### Social Authentication
- Enable Google, GitHub, or other providers in Auth → Settings
- Configure OAuth apps with respective providers

### Real-time Features
- Subscribe to leaderboard changes for live updates
- Add real-time notifications when friends beat your score

### Analytics
- Track user engagement with Supabase Analytics
- Monitor authentication conversion rates

## 🔒 Security Best Practices

1. **Never commit credentials**: Use environment variables
2. **Use RLS**: Already enabled in the schema
3. **Validate data**: Client-side validation is in place
4. **Monitor usage**: Check Supabase dashboard regularly
5. **Backup data**: Enable point-in-time recovery for production

## 📞 Support

If you encounter issues:
1. Check the [Supabase documentation](https://supabase.com/docs)
2. Visit the [Supabase Discord](https://discord.supabase.com)
3. Review browser console for error messages
4. Ensure all SQL commands executed successfully

---

Your leaderboard is now ready! Players can sign up, compete for high scores, and climb the rankings! 🏆🐔