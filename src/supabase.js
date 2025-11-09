// Supabase Configuration and Authentication
// To use this, you need to:
// 1. Sign up at https://supabase.com
// 2. Create a new project
// 3. Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project's values
// 4. Set up the database schema (see README for SQL commands)

const SUPABASE_URL = "https://psmayktepqucwblmyhxn.supabase.co"; // Replace with your Supabase URL
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzbWF5a3RlcHF1Y3dibG15aHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDA0ODEsImV4cCI6MjA3NTc3NjQ4MX0.05rZhF4sDcuBNQ09887Fma8XbBWLp3i3kmZKfL9G3Os"; // Replace with your Supabase anon key

class SupabaseClient {
  constructor() {
    this.supabase = null;
    this.user = null;
    this.initialized = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    try {
      // Check if Supabase is configured
      if (
        SUPABASE_URL === "YOUR_SUPABASE_URL" ||
        SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY"
      ) {
        console.warn(
          "Supabase not configured. Leaderboard features will be disabled."
        );
        return false;
      }

      // Load Supabase from CDN
      if (!window.supabase) {
        await this.loadSupabaseSDK();
      }

      // Initialize Supabase client
      this.supabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

      // Get current session
      const {
        data: { session },
      } = await this.supabase.auth.getSession();
      this.user = session?.user || null;

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange((event, session) => {
        this.user = session?.user || null;
        this.onAuthStateChange(event, session);
      });

      this.initialized = true;
      console.log("Supabase initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Supabase:", error);
      return false;
    }
  }

  async loadSupabaseSDK() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  onAuthStateChange(event, session) {
    if (window.game && window.game.ui) {
      window.game.ui.updateAuthUI(this.user);
    }

    // Trigger custom events
    window.dispatchEvent(
      new CustomEvent("authStateChange", {
        detail: { event, session, user: this.user },
      })
    );
  }

  isAuthenticated() {
    return !!this.user;
  }

  getUser() {
    return this.user;
  }

  async signUp(email, password, username) {
    if (!this.supabase) {
      throw new Error("Supabase not initialized");
    }

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split("@")[0],
          display_name: username || email.split("@")[0],
        },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async signIn(email, password) {
    if (!this.supabase) {
      throw new Error("Supabase not initialized");
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async signOut() {
    if (!this.supabase) {
      throw new Error("Supabase not initialized");
    }

    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }

    this.user = null;
  }

  async resetPassword(email) {
    if (!this.supabase) {
      throw new Error("Supabase not initialized");
    }

    const { error } = await this.supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw error;
    }
  }

  async updateProfile(updates) {
    if (!this.supabase || !this.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await this.supabase.auth.updateUser({
      data: updates,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  // Leaderboard functions
  async submitScore(score, level, timeToComplete) {
    if (!this.supabase || !this.user) {
      throw new Error("User not authenticated");
    }

    console.log('Submitting score with data:', {
      user_id: this.user.id,
      username: this.user.user_metadata.username || this.user.email.split("@")[0],
      score: score,
      level_reached: level,
      time_to_complete: timeToComplete
    });

    const { data, error } = await this.supabase.from("leaderboard").insert([
      {
        user_id: this.user.id,
        username:
          this.user.user_metadata.username || this.user.email.split("@")[0],
        score: score,
        level_reached: level,
        time_to_complete: timeToComplete,
        created_at: new Date().toISOString(),
      },
    ]);

    console.log('Insert result:', { data, error });

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    return data;
  }

  async getLeaderboard(limit = 10) {
    if (!this.supabase) {
      throw new Error("Supabase not initialized");
    }

    // Get all scores ordered by score descending
    const { data, error } = await this.supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false });

    if (error) {
      throw error;
    }

    // Filter to show only the best score per user
    const userBestScores = new Map();

    for (const entry of data) {
      if (!userBestScores.has(entry.user_id)) {
        userBestScores.set(entry.user_id, entry);
      }
    }

    // Convert map to array and sort by score, then limit
    const uniqueUserScores = Array.from(userBestScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return uniqueUserScores;
  }

  async getUserBestScore() {
    if (!this.supabase || !this.user) {
      return null;
    }

    const { data, error } = await this.supabase
      .from("leaderboard")
      .select("*")
      .eq("user_id", this.user.id)
      .order("score", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching user best score:", error);
      return null;
    }

    return data?.[0] || null;
  }

  async getUserRank() {
    if (!this.supabase || !this.user) {
      return null;
    }

    const userBest = await this.getUserBestScore();
    if (!userBest) return null;

    const { count, error } = await this.supabase
      .from("leaderboard")
      .select("*", { count: "exact", head: true })
      .gt("score", userBest.score);

    if (error) {
      console.error("Error fetching user rank:", error);
      return null;
    }

    return count + 1;
  }

  async getGlobalStats() {
    if (!this.supabase) {
      throw new Error("Supabase not initialized");
    }

    const { data, error } = await this.supabase
      .from("leaderboard")
      .select("score, level_reached, time_to_complete");

    if (error) {
      throw error;
    }

    const stats = {
      totalPlayers: data.length,
      highestScore: Math.max(...data.map((d) => d.score)),
      averageScore: data.reduce((sum, d) => sum + d.score, 0) / data.length,
      fastestTime: Math.min(...data.map((d) => d.time_to_complete)),
      maxLevel: Math.max(...data.map((d) => d.level_reached)),
    };

    return stats;
  }

  // Utility functions
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  formatScore(score) {
    return score.toLocaleString();
  }

  isSupabaseConfigured() {
    return (
      SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
      SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
    );
  }
}

// Create global instance
window.supabaseClient = new SupabaseClient();
