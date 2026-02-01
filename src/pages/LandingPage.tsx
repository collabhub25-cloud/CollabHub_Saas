import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { AnimatedContainer } from '@/components/shared/AnimatedContainer';
import {
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
  Shield,
  MessageSquare,
  BarChart3,
  Globe,
  CheckCircle2,
  Star,
  Briefcase,
  Building2,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Find Your Team',
    description: 'Connect with talented professionals who share your vision and complement your skills.',
  },
  {
    icon: TrendingUp,
    title: 'Investor Network',
    description: 'Access a curated network of investors looking for the next big opportunity.',
  },
  {
    icon: Shield,
    title: 'Verified Profiles',
    description: 'Build trust with verified profiles, portfolios, and transparent credentials.',
  },
  {
    icon: MessageSquare,
    title: 'Seamless Communication',
    description: 'Built-in messaging and collaboration tools to keep everyone aligned.',
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description: 'Monitor milestones, track applications, and measure your success.',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Connect with talent and investors from around the world.',
  },
];

const testimonials = [
  {
    name: 'Alex Chen',
    role: 'Founder, TechFlow',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    content: 'CollabHub helped me find my CTO and first engineer within two weeks. The quality of talent here is exceptional.',
    rating: 5,
  },
  {
    name: 'Sarah Miller',
    role: 'Product Designer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    content: 'I found my dream startup through CollabHub. The platform makes it easy to discover companies aligned with my values.',
    rating: 5,
  },
  {
    name: 'Michael Ross',
    role: 'Partner, Horizon Ventures',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    content: 'As an investor, CollabHub has become my go-to platform for discovering promising early-stage startups.',
    rating: 5,
  },
];

const stats = [
  { value: '10K+', label: 'Startups' },
  { value: '50K+', label: 'Talents' },
  { value: '2K+', label: 'Investors' },
  { value: '$500M+', label: 'Funding Raised' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-6">
            <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-50" />
        </div>
        
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedContainer variant="slide-up">
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Trusted by 10,000+ startups worldwide
              </Badge>
            </AnimatedContainer>
            
            <AnimatedContainer variant="slide-up" delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
                Build Your Dream{' '}
                <span className="gradient-text">Startup Team</span>
              </h1>
            </AnimatedContainer>
            
            <AnimatedContainer variant="slide-up" delay={0.2}>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Connect with top talent, discover innovative startups, and meet investors 
                who believe in your vision. All in one powerful platform.
              </p>
            </AnimatedContainer>
            
            <AnimatedContainer variant="slide-up" delay={0.3}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8" asChild>
                  <Link to="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8" asChild>
                  <Link to="/discover/startups">
                    Explore Startups
                  </Link>
                </Button>
              </div>
            </AnimatedContainer>

            {/* Stats */}
            <AnimatedContainer variant="fade" delay={0.5}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Build
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful tools and features designed to help founders, talents, and investors succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <AnimatedContainer key={index} variant="scale" delay={index * 0.1}>
                <div className="group p-6 rounded-2xl bg-card border hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </AnimatedContainer>
            ))}
          </div>
        </div>
      </section>

      {/* For Founders Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedContainer variant="slide-right">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-2xl" />
                <div className="relative bg-card border rounded-3xl p-8 shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">For Founders</h3>
                      <p className="text-muted-foreground">Build your dream team</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {[
                      'Post your startup and attract top talent',
                      'Review applications and connect with candidates',
                      'Showcase your vision to potential investors',
                      'Track progress with powerful analytics',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" asChild>
                    <Link to="/signup">Start Building</Link>
                  </Button>
                </div>
              </div>
            </AnimatedContainer>

            <AnimatedContainer variant="slide-left">
              <div>
                <Badge variant="secondary" className="mb-4">For Founders</Badge>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Turn Your Vision Into Reality
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Whether you&apos;re at the idea stage or scaling rapidly, CollabHub connects you 
                  with the talent and resources you need to succeed.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4 text-primary" />
                    <span>Quick setup</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4 text-primary" />
                    <span>50K+ talents</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Verified profiles</span>
                  </div>
                </div>
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* For Talent Section */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedContainer variant="slide-right" className="order-2 lg:order-1">
              <div>
                <Badge variant="secondary" className="mb-4">For Talent</Badge>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Find Your Perfect Role
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Discover startups that match your skills, values, and career goals. 
                  Apply with one click and track your applications in real-time.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <span>10K+ startups</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="w-4 h-4 text-primary" />
                    <span>Remote-friendly</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>Equity options</span>
                  </div>
                </div>
              </div>
            </AnimatedContainer>

            <AnimatedContainer variant="slide-left" className="order-1 lg:order-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-2xl" />
                <div className="relative bg-card border rounded-3xl p-8 shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Briefcase className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">For Talent</h3>
                      <p className="text-muted-foreground">Find your dream job</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {[
                      'Create a standout profile in minutes',
                      'Browse startups by role, location, and stage',
                      'Apply to multiple positions with ease',
                      'Connect directly with founders',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" asChild>
                    <Link to="/signup">Find Opportunities</Link>
                  </Button>
                </div>
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Loved by Founders, Talent, and Investors
            </h2>
            <p className="text-lg text-muted-foreground">
              See what our community has to say about their CollabHub experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <AnimatedContainer key={index} variant="scale" delay={index * 0.1}>
                <div className="p-6 rounded-2xl bg-card border h-full">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </AnimatedContainer>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative px-8 py-16 lg:px-16 lg:py-24 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Ready to Build Something Amazing?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of founders, talents, and investors who are already building 
                the future on CollabHub.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8" asChild>
                  <Link to="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 border-primary-foreground/20 hover:bg-primary-foreground/10" asChild>
                  <Link to="/contact">Talk to Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo className="mb-4" />
              <p className="text-sm text-muted-foreground">
                The platform where founders build teams, talents find opportunities, 
                and investors discover the next big thing.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/features" className="hover:text-foreground">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link to="/discover/startups" className="hover:text-foreground">Startups</Link></li>
                <li><Link to="/discover/talents" className="hover:text-foreground">Talent</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground">About</Link></li>
                <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-foreground">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
                <li><Link to="/cookies" className="hover:text-foreground">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} CollabHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
