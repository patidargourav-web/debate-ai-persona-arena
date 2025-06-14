
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    emoji: "🤖",
    title: "AI Debates",
    description: "Sharpen your skills by debating advanced AI opponents that adapt to your arguments."
  },
  {
    emoji: "🥊",
    title: "User vs User",
    description: "Challenge real users in live debate battles and climb the ranks."
  },
  {
    emoji: "📊",
    title: "Performance Analytics",
    description: "Get instant feedback on your structure, clarity, and persuasiveness."
  },
  {
    emoji: "🏆",
    title: "Leaderboard",
    description: "Compete globally and see how you stack up against top debaters!"
  },
];

const Landing: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleSignUp = () => navigate("/auth?signup=1");
  const handleSignIn = () => navigate("/auth");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8 animate-slide-up">
        <h1 className="text-5xl font-extrabold gradient-text mb-3 tracking-tight">Debatrix</h1>
        <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
          The immersive debate app powered by AI. Elevate your debating skills, compete with others, and master the art of argument.
        </p>
      </div>
      
      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up" style={{animationDelay: '0.15s'}}>
        <Button onClick={handleSignUp} className="btn-primary text-lg px-8 py-4 w-full sm:w-auto animate-glow">
          Sign Up
        </Button>
        <Button onClick={handleSignIn} className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
          Sign In
        </Button>
      </div>

      {/* Features section */}
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {features.map((feature, idx) => (
          <div key={feature.title} className="card-feature p-6 bg-card shadow-md rounded-lg text-center animate-fade-in" style={{animationDelay: `${0.15 + idx * 0.1}s`}}>
            <div className="text-4xl mb-3">{feature.emoji}</div>
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground text-sm">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground mt-auto mb-5">
        &copy; {new Date().getFullYear()} Debatrix · Master the art of argument
      </div>
    </div>
  );
};

export default Landing;
