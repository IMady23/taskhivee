import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Users, 
  Target, 
  MessageSquare, 
  BarChart3, 
  Bug,
  ArrowRight,
  Star
} from 'lucide-react';

export default function SimpleLanding() {
  const features = [
    {
      icon: <Target className="w-8 h-8 text-blue-600" />,
      title: "Task Management",
      description: "Create, assign, and track tasks with real-time status updates and progress monitoring."
    },
    {
      icon: <Users className="w-8 h-8 text-green-600" />,
      title: "Team Collaboration",
      description: "Seamless team coordination with role-based access and member management."
    },
    {
      icon: <Bug className="w-8 h-8 text-red-600" />,
      title: "Bug Tracking",
      description: "Report, track, and resolve bugs efficiently with severity-based prioritization."
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-purple-600" />,
      title: "Real-time Communication",
      description: "Built-in chat system for instant team communication and collaboration."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-orange-600" />,
      title: "Analytics & Insights",
      description: "Comprehensive project analytics with performance metrics and AI-powered insights."
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-teal-600" />,
      title: "Progress Tracking",
      description: "Visual progress indicators and milestone tracking for better project oversight."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Project Manager",
      content: "TaskHive transformed how our team collaborates. The real-time updates keep everyone aligned.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Development Lead",
      content: "The bug tracking system is intuitive and the analytics help us improve our workflow continuously.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-[hsl(var(--card))] shadow-sm border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">TaskHive</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/auth?mode=login" 
                className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/auth?mode=signup" 
                className="bg-[hsl(var(--primary))] text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[hsl(var(--primary)/0.1)] to-[hsl(var(--accent)/0.1)] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-[hsl(var(--foreground))] mb-6">
              TaskHive
            </h1>
            <p className="text-2xl md:text-3xl text-[hsl(var(--foreground))] mb-4 font-medium">
              Plan. Assign. Track. Collaborate — All in One Place
            </p>
            <p className="text-xl text-[hsl(var(--muted-foreground))] mb-12 max-w-3xl mx-auto">
              The complete project management solution that brings teams together. 
              Streamline your workflow with powerful task management, real-time collaboration, 
              and intelligent insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/auth?mode=signup" 
                className="bg-[hsl(var(--primary))] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition flex items-center gap-2"
              >
                Start as Team Leader
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/auth?mode=signup" 
                className="bg-[hsl(var(--card))] text-[hsl(var(--primary))] border-2 border-[hsl(var(--primary))] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[hsl(var(--primary)/0.1)] transition"
              >
                Join as Team Member
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[hsl(var(--background))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-4">
              Everything You Need to Manage Projects
            </h2>
            <p className="text-xl text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
              TaskHive provides all the tools your team needs to stay organized, 
              communicate effectively, and deliver projects on time.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[hsl(var(--muted-foreground))]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-[hsl(var(--muted))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-4">
              How TaskHive Works
            </h2>
            <p className="text-xl text-[hsl(var(--muted-foreground))]">
              Get started in minutes with our simple three-step process
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-[hsl(var(--primary))] text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-3">
                Create Your Team
              </h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                Sign up as a team leader, create your team, and invite members with unique team codes.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-[hsl(var(--success))] text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-3">
                Assign & Track Tasks
              </h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                Create tasks, assign them to team members, and track progress in real-time.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-3">
                Collaborate & Deliver
              </h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                Use built-in chat, track bugs, and leverage analytics to deliver projects successfully.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-[hsl(var(--background))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-4">
              Trusted by Teams Worldwide
            </h2>
            <p className="text-xl text-[hsl(var(--muted-foreground))]">
              See what teams are saying about TaskHive
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-[hsl(var(--foreground))] mb-6 text-lg">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">{testimonial.name}</p>
                  <p className="text-[hsl(var(--muted-foreground))]">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[hsl(var(--primary))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Team's Productivity?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of teams who have streamlined their workflow with TaskHive. 
            Start your free account today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/auth?mode=signup" 
              className="bg-white text-[hsl(var(--primary))] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/auth?mode=signup" 
              className="text-white border-2 border-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-[hsl(var(--primary))] transition"
            >
              Join Existing Team
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] text-[hsl(var(--foreground))] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">TaskHive</h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">
              Plan. Assign. Track. Collaborate — All in One Place
            </p>
            <div className="flex justify-center space-x-6">
              <Link to="/auth?mode=signup" className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition">
                For Leaders
              </Link>
              <Link to="/auth?mode=signup" className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition">
                For Members
              </Link>
            </div>
            <div className="mt-8 pt-8 border-t border-[hsl(var(--border))]">
              <p className="text-[hsl(var(--muted-foreground))] text-sm">
                © 2024 TaskHive. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}