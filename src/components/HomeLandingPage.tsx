
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const HomeLandingPage = ({
  onStartDebate,
  onUserDebates,
  onLeaderboard,
}: {
  onStartDebate: () => void;
  onUserDebates: () => void;
  onLeaderboard: () => void;
}) => {
  return (
    <section
      className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-background via-[#182224] to-[#15181d] relative overflow-hidden"
    >
      {/* Modern Glassy Blur Top Gradient */}
      <div className="absolute top-0 right-0 w-[480px] h-[320px] bg-gradient-to-br from-primary/30 to-purple-600/60 rounded-full blur-3xl opacity-60 pointer-events-none z-0" />
      {/* Modern Glassy Blur Bottom Gradient */}
      <div className="absolute bottom-0 left-0 w-[520px] h-[320px] bg-gradient-to-tr from-primary/30 to-blue-600/60 rounded-full blur-3xl opacity-50 pointer-events-none z-0" />

      {/* Hero Section */}
      <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center relative z-10 pt-20 md:pt-32 pb-10 animate-fade-in">
        <h1 className="text-display gradient-text font-extrabold tracking-tight mb-4 animate-slide-up">
          Welcome to <span className="text-primary">Debatrix</span>
        </h1>
        <p className="text-subheading max-w-2xl mx-auto text-muted-foreground mb-6 animate-fade-in">
          Elevate your speaking and debating skills with immersive AI-powered practice, real-time feedback, and vibrant live competitions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 animate-fade-in">
          <Button 
            size="lg"
            className="btn-primary text-lg px-8 py-4 w-full sm:w-auto animate-glow"
            onClick={onStartDebate}
          >
            🎯 Start AI Debate
          </Button>
          <Button 
            size="lg"
            className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto"
            onClick={onUserDebates}
          >
            🥊 Challenge Users
          </Button>
          <Button 
            size="lg"
            className="btn-ghost text-lg px-8 py-4 w-full sm:w-auto"
            onClick={onLeaderboard}
          >
            🏆 View Leaderboard
          </Button>
        </div>
      </div>

      {/* Modern Features Grid */}
      <div className="container mx-auto px-4 z-10 relative pb-12 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="card-feature text-center p-8 animate-fade-in hover:modern-shadow-lg transition-shadow duration-300">
            <div className="text-4xl mb-4 animate-float">🤖</div>
            <h3 className="text-heading mb-2">Debate with AI Personas</h3>
            <p className="text-body text-muted-foreground">
              Face off against sophisticated AI debaters tailored to challenge you at any level.
            </p>
          </Card>
          <Card className="card-feature text-center p-8 animate-fade-in hover:modern-shadow-lg transition-shadow duration-300" style={{animationDelay: "0.05s"}}>
            <div className="text-4xl mb-4 animate-float">🌎</div>
            <h3 className="text-heading mb-2">Global Live Challenges</h3>
            <p className="text-body text-muted-foreground">
              Join an arena of debaters from around the world. Rise through the rankings and prove your mettle!
            </p>
          </Card>
          <Card className="card-feature text-center p-8 animate-fade-in hover:modern-shadow-lg transition-shadow duration-300" style={{animationDelay: "0.1s"}}>
            <div className="text-4xl mb-4 animate-float">📊</div>
            <h3 className="text-heading mb-2">Real-time Performance Feedback</h3>
            <p className="text-body text-muted-foreground">
              Get instant analysis on your argument structure, clarity, and style so you can improve every time.
            </p>
          </Card>
          <Card className="card-feature text-center p-8 animate-fade-in hover:modern-shadow-lg transition-shadow duration-300" style={{animationDelay: "0.15s"}}>
            <div className="text-4xl mb-4 animate-float">🏅</div>
            <h3 className="text-heading mb-2">Personal Progress & Leaderboard</h3>
            <p className="text-body text-muted-foreground">
              Track your improvements, unlock achievements, and compete for your spot at the top.
            </p>
          </Card>
        </div>
      </div>

      {/* Immersive Stat Section */}
      <div className="container mx-auto px-4 mb-12 z-10">
        <Card className="card-modern text-center max-w-3xl mx-auto py-10 px-2 animate-fade-in">
          <h2 className="text-heading mb-8">Trusted by Debaters Worldwide</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-primary">1000+</div>
                <p className="text-muted-foreground">Active Debaters</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-primary">50k+</div>
                <p className="text-muted-foreground">Debates Completed</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-primary">98%</div>
                <p className="text-muted-foreground">Skill Improvement</p>
              </div>
            </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="text-center text-muted-foreground py-8 text-xs relative z-10">
        © {new Date().getFullYear()} Debatrix. All rights reserved.
      </footer>
    </section>
  );
};

export default HomeLandingPage;
