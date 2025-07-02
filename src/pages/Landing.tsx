
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

const features = [
  {
    emoji: "🤖",
    title: "AI Debates",
    description:
      "Sharpen your skills by debating advanced AI opponents that adapt to your arguments and rhetorics.",
  },
  {
    emoji: "🥊",
    title: "User vs User",
    description:
      "Challenge real users in live debate battles and climb up the ranks. Engage real minds.",
  },
  {
    emoji: "📊",
    title: "Performance Analytics",
    description:
      "Receive instant, actionable feedback on your structure, clarity, and persuasiveness—visualized.",
  },
  {
    emoji: "🏆",
    title: "Leaderboard",
    description:
      "Compete globally and see how you stack up against top debaters! Become a legend.",
  },
];

const gradientBg = "bg-gradient-to-br from-primary/80 via-accent/40 to-background";
const accentShape = "absolute rounded-full opacity-30 blur-2xl pointer-events-none mix-blend-lighten";

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
    <div className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden mobile-spacing ${gradientBg}`}>
      {/* Animated/Decorative Background Shapes - Hidden on mobile for better performance */}
      <div className={`${accentShape} w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] lg:w-[440px] lg:h-[440px] bg-primary top-[-60px] sm:top-[-80px] lg:top-[-120px] left-[-60px] sm:left-[-80px] lg:left-[-120px] animate-float hidden sm:block`}></div>
      <div className={`${accentShape} w-[180px] h-[160px] sm:w-[240px] sm:h-[200px] lg:w-[320px] lg:h-[280px] bg-gradient-to-br from-accent to-secondary right-[-50px] sm:right-[-70px] lg:right-[-100px] top-1/3 animate-float hidden sm:block`} style={{ animationDelay: "1.2s" }}></div>
      <div className={`${accentShape} w-[120px] h-[80px] sm:w-[160px] sm:h-[100px] lg:w-[200px] lg:h-[140px] bg-muted bottom-10 left-1/2 animate-float hidden sm:block`} style={{ animationDelay: "2.4s" }}></div>
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 animate-slide-up w-full">
          <h1 className="mobile-display-responsive font-extrabold gradient-text tracking-tighter drop-shadow-lg mb-4 font-sans leading-tight">
            Debatrix
          </h1>
          <div className="mobile-spacing-sm max-w-4xl mx-auto">
            <p className="mobile-heading-responsive text-muted-foreground font-medium animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <span className="bg-card/70 mobile-spacing-sm rounded-xl shadow-sm inline-block leading-relaxed">
                The immersive debate platform powered by AI.<br className="hidden sm:block" />
                <span className="block sm:inline"> Elevate your skills, compete, and master the art of argument.</span>
              </span>
            </p>
          </div>
        </div>
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row mobile-gap-responsive justify-center items-stretch sm:items-center mb-12 sm:mb-16 animate-slide-up w-full max-w-md sm:max-w-none mx-auto" style={{ animationDelay: "0.22s" }}>
          <Button
            onClick={handleSignUp}
            className="btn-primary mobile-text-responsive mobile-touch-target px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto animate-glow drop-shadow-lg"
          >
            <UserPlus className="mr-2" size={20} />
            Sign Up
          </Button>
          <Button
            onClick={handleSignIn}
            className="btn-secondary mobile-text-responsive mobile-touch-target px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto drop-shadow"
            variant={"secondary"}
          >
            <LogIn className="mr-2" size={20} />
            Sign In
          </Button>
        </div>
        {/* Features */}
        <div className="w-full max-w-6xl mx-auto grid mobile-grid-responsive mobile-gap-responsive mb-16 sm:mb-20">
          {features.map((feature, idx) => (
            <div
              key={feature.title}
              className={`card-feature mobile-spacing flex flex-col items-center justify-between text-center bg-card/80 rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300 border border-primary/20 animate-fade-in h-full`}
              style={{ animationDelay: `${0.28 + idx * 0.08}s` }}
            >
              <div className="text-4xl sm:text-5xl mb-3 drop-shadow-xl">{feature.emoji}</div>
              <h3 className="font-semibold mobile-text-lg mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground mobile-text-responsive leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
        {/* Extra Section: Call to Action */}
        <div className="w-full max-w-2xl text-center mt-2 mb-16">
          <div className="card-modern py-8 px-6 sm:px-12 bg-background/90 border border-primary/30 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-200 animate-fade-in" style={{animationDelay: "0.6s"}}>
            <span className="text-2xl font-bold text-primary block mb-2">🚀 Ready to level up your debating?</span>
            <span className="text-muted-foreground leading-relaxed">
              Join Debatrix. Debates are smarter, faster, more insightful—thanks&nbsp;to&nbsp;AI.
            </span>
          </div>
        </div>
        {/* Footer */}
        <footer className="relative z-10 w-full text-center text-sm pt-10 pb-3">
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted-foreground">
              &copy; {new Date().getFullYear()} <b>Debatrix</b> &middot; Master the art of argument
            </span>
            <span className="text-muted-foreground/70 text-xs">Built with AI, passion, and modern web tech</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
