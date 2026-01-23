import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, Flame, Target, Zap, TrendingUp, Trophy, Star, ArrowRight, Sparkles, 
  BookOpen, Clock, Award, Users, Lightbulb, Heart, CheckCircle, Rocket, LineChart,
  BarChart3, Shield, Maximize2, Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';

const WhyUsPage = () => {
  const [activeCard, setActiveCard] = useState(0);
  const [visibleStats, setVisibleStats] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setVisibleStats(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const heroFeatures = [
    {
      icon: Brain,
      title: "AI That Actually Gets You",
      desc: "Not just adaptive – it understands your learning style, struggles, and goals with precision"
    },
    {
      icon: Flame,
      title: "Built by JEE Survivors",
      desc: "We've walked your path. Every feature solves a real problem we faced"
    },
    {
      icon: Target,
      title: "Results, Not Just Practice",
      desc: "Strategic question selection that maximizes your growth and builds true mastery"
    },
    {
      icon: Zap,
      title: "Instant Clarity",
      desc: "Get explanations that click instantly. No confusion. No wasted time"
    }
  ];

  const stats = [
    { num: "50K+", label: "Active Students", icon: Users, color: "from-[#e6eeff] to-[#cfe0ff]" },
    { num: "98%", label: "Show Improvement", icon: TrendingUp, color: "from-[#e6eeff] to-[#cfe0ff]" },
    { num: "40K+", label: "Questions", icon: BookOpen, color: "from-[#e6eeff] to-[#cfe0ff]" },
    { num: "24/7", label: "AI Mentor", icon: Clock, color: "from-[#e6eeff] to-[#cfe0ff]" }
  ];

  const differenceCards = [
    {
      icon: Maximize2,
      title: "Adaptive Difficulty",
      description: "Questions scale perfectly with your level",
      points: [
        "AI tracks 100+ performance metrics",
        "Difficulty adjusts in real-time",
        "Never too easy, never frustrating"
      ]
    },
    {
      icon: Heart,
      title: "Burnout Prevention",
      description: "Smart learning that protects your mental health",
      points: [
        "Detects stress patterns automatically",
        "Recommends optimal study times",
        "Celebrates small wins"
      ]
    },
    {
      icon: Trophy,
      title: "Gamification That Works",
      description: "Motivation without toxicity",
      points: [
        "Level-matched leaderboards",
        "Meaningful badges & rewards",
        "Streaks that encourage consistency"
      ]
    },
    {
      icon: Lightbulb,
      title: "Deep Concept Learning",
      description: "Understand the 'why' behind every topic",
      points: [
        "Interactive concept visualization",
        "Cross-topic connections",
        "Spaced repetition built-in"
      ]
    },
    {
      icon: Shield,
      title: "Progress Tracking",
      description: "See exactly where you stand",
      points: [
        "Real-time rank predictions",
        "Strength/weakness heatmaps",
        "Expected score on actual exams"
      ]
    },
    {
      icon: Compass,
      title: "Smart Test Series",
      description: "Exam-realistic tests when you're ready",
      points: [
        "Curriculum-aligned mock tests",
        "Performance analytics post-test",
        "Targeted revision recommendations"
      ]
    }
  ];

  const testimonials = [
    {
      name: "Arjun K.",
      rank: "AIR 287",
      text: "The daily streaks kept me consistent. It felt like having a mentor who actually understood my weak areas better than I did.",
      image: "A"
    },
    {
      name: "Priya S.",
      rank: "AIR 512",
      text: "From struggling with organic chemistry to scoring 95+ – JEEnius's AI made concepts click. Absolutely life-changing.",
      image: "P"
    },
    {
      name: "Rohan M.",
      rank: "AIR 1024",
      text: "The mock tests were more realistic than my coaching center's. The explanations are 10x better too.",
      image: "R"
    },
    {
      name: "Neha D.",
      rank: "AIR 156",
      text: "I saved 3 hours a day because the app learned what to focus on. Quality over quantity – finally.",
      image: "N"
    }
  ];

  const comparisons = [
    { feature: "Adaptive Difficulty", jeenius: true, others: false },
    { feature: "Burnout Detection", jeenius: true, others: false },
    { feature: "AI Explanations", jeenius: true, others: "Basic" },
    { feature: "Progress Predictions", jeenius: true, others: false },
    { feature: "Smart Scheduling", jeenius: true, others: false },
    { feature: "Gamification", jeenius: "Balanced", others: "Aggressive" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Background decoration - matching landing */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#e6eeff] rounded-full translate-x-1/4 opacity-60 blur-3xl" />
        <div className="absolute bottom-40 left-0 w-[420px] h-[420px] bg-[#e6eeff] rounded-full -translate-x-1/4 opacity-40 blur-2xl" />
      </div>

      <div className="relative z-10 pt-16 sm:pt-20 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-16 sm:mb-20 space-y-6">
            <Badge className="inline-flex bg-[#013062] text-white px-4 py-2 text-xs sm:text-sm font-semibold rounded-full">
              <Rocket className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Built by JEE Rank Holders
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#013062] leading-[1.2] space-y-2">
              <div>Why We're Different</div>
              <div className="text-[#013062]/70">from every other app</div>
            </h1>
            
            <p className="text-base sm:text-lg text-[#013062]/60 max-w-3xl mx-auto leading-relaxed">
              We didn't build an app. We built a <span className="font-semibold text-[#013062]">mentor</span> that evolves with you. 
              Smart. Caring. Relentless about your success.
            </p>
          </div>

          {/* Rotating Feature Cards */}
          <div className="max-w-4xl mx-auto mb-16 sm:mb-20">
            <div className="relative h-auto min-h-[220px] sm:min-h-[200px]">
              {heroFeatures.map((feature, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    activeCard === idx 
                      ? 'opacity-100 transform translate-y-0 scale-100' 
                      : 'opacity-0 transform translate-y-4 scale-95 pointer-events-none'
                  }`}
                >
                  <Card className="bg-gradient-to-br from-[#013062] to-[#013062]/90 border-0 shadow-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-8 sm:p-10">
                      <div className="flex items-start gap-6">
                        <div className="p-4 bg-white/10 rounded-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                            {feature.title}
                          </h3>
                          <p className="text-base sm:text-lg text-white/80 leading-relaxed">
                            {feature.desc}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {heroFeatures.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCard(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    activeCard === idx 
                      ? 'w-8 h-2 bg-[#013062]' 
                      : 'w-2 h-2 bg-[#e9e9e9] hover:bg-[#013062]/30'
                  }`}
                  aria-label={`Go to feature ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-16 sm:mb-20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {stats.map((stat, idx) => (
                <Card 
                  key={idx} 
                  className={`bg-white border border-[#e9e9e9] hover:border-[#013062]/30 hover:shadow-xl transition-all duration-300 group overflow-hidden ${
                    visibleStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{
                    transitionDelay: visibleStats ? `${idx * 100}ms` : '0ms',
                    transform: visibleStats ? 'translateY(0)' : 'translateY(16px)',
                    opacity: visibleStats ? 1 : 0
                  }}
                >
                  <CardContent className="p-5 sm:p-6 text-center">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-3 group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#013062]" />
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-[#013062] mb-1">
                      {stat.num}
                    </div>
                    <div className="text-xs sm:text-sm text-[#013062]/60 font-medium">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* What Makes Us Different */}
          <div className="mb-16 sm:mb-20">
            <div className="text-center mb-10 sm:mb-14">
              <Badge className="inline-flex bg-[#e6eeff] text-[#013062] px-4 py-2 text-xs sm:text-sm font-semibold rounded-full mb-4">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Our Core Strengths
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#013062] leading-tight">
                Features That <span className="text-[#013062]/70">Actually Matter</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {differenceCards.map((card, idx) => (
                <Card 
                  key={idx} 
                  className="bg-white border border-[#e9e9e9] hover:border-[#013062]/30 hover:shadow-xl transition-all duration-300 group h-full overflow-hidden"
                >
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="p-4 bg-[#e6eeff] rounded-2xl w-fit mb-4 group-hover:scale-110 group-hover:bg-[#013062] transition-all duration-300">
                      <card.icon className="w-6 h-6 text-[#013062] group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-[#013062] mb-1">
                      {card.title}
                    </h3>
                    <p className="text-sm text-[#013062]/60 mb-4">
                      {card.description}
                    </p>
                    <div className="space-y-2 flex-1">
                      {card.points.map((point, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-[#013062] mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-[#013062]/70">{point}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Comparison Section */}
          <div className="mb-16 sm:mb-20 bg-[#f8f9ff] rounded-3xl p-6 sm:p-10 border border-[#e6eeff]">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#013062] mb-3">
                How We Compare
              </h2>
              <p className="text-[#013062]/60 text-base">
                We do things differently – in ways that actually matter for your success
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e6eeff]">
                    <th className="text-left py-3 px-4 text-[#013062] font-bold">Feature</th>
                    <th className="text-center py-3 px-4 text-[#013062] font-bold">JEEnius</th>
                    <th className="text-center py-3 px-4 text-[#013062]/60 font-bold">Other Apps</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((comp, idx) => (
                    <tr key={idx} className="border-b border-[#e6eeff] hover:bg-white/50 transition-colors">
                      <td className="py-4 px-4 text-[#013062] font-medium">{comp.feature}</td>
                      <td className="py-4 px-4 text-center">
                        {comp.jeenius === true ? (
                          <CheckCircle className="w-6 h-6 text-[#013062] mx-auto" />
                        ) : (
                          <span className="text-[#013062] font-semibold">{comp.jeenius}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center text-[#013062]/40">
                        {comp.others === false ? '✗' : comp.others}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-16 sm:mb-20">
            <div className="text-center mb-10 sm:mb-14">
              <Badge className="inline-flex bg-[#e6eeff] text-[#013062] px-4 py-2 text-xs sm:text-sm font-semibold rounded-full mb-4">
                <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Success Stories
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#013062] leading-tight">
                Real Students. Real <span className="text-[#013062]/70">Results</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((test, idx) => (
                <Card 
                  key={idx} 
                  className="bg-white border border-[#e9e9e9] hover:border-[#013062]/30 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                >
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#013062] to-[#013062]/80 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {test.image}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-base text-[#013062]">{test.name}</div>
                        <Badge className="bg-[#e6eeff] text-[#013062] text-xs font-semibold mt-1">
                          {test.rank}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-base text-[#013062]/70 leading-relaxed italic">
                      "{test.text}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <Card className="bg-gradient-to-br from-[#013062] via-[#013062] to-[#013062]/90 border-0 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
            </div>
            <CardContent className="relative p-8 sm:p-12 md:p-16 text-center">
              <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  Ready to prepare smarter?
                </h2>
                <p className="text-lg text-white/80 leading-relaxed">
                  Join 50K+ students who chose quality learning over endless grinding. Start free today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button 
                    onClick={() => navigate('/signup')}
                    className="bg-white hover:bg-[#e6eeff] text-[#013062] font-bold text-base px-8 py-6 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                  >
                    Start Free
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/login')}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 font-bold text-base px-8 py-6 rounded-full transition-all duration-300"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WhyUsPage;
