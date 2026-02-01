import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedContainer } from '@/components/shared/AnimatedContainer';
import { 
  Target, 
  Heart, 
  Zap, 
  Users, 
  Globe, 
  Shield,
  ArrowRight,
  Quote
} from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Mission-Driven',
    description: 'We believe great companies are built by passionate people working toward a common goal.',
  },
  {
    icon: Heart,
    title: 'People First',
    description: 'Every feature we build is designed to help people connect, collaborate, and succeed.',
  },
  {
    icon: Zap,
    title: 'Move Fast',
    description: 'Speed matters in startups. Our platform helps you move from idea to execution faster.',
  },
  {
    icon: Shield,
    title: 'Trust & Transparency',
    description: 'Verified profiles, transparent processes, and honest communication build lasting relationships.',
  },
];

const team = [
  {
    name: 'Alex Rivera',
    role: 'CEO & Co-founder',
    bio: 'Former product lead at Stripe. Passionate about building tools that empower founders.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  },
  {
    name: 'Maya Johnson',
    role: 'CTO & Co-founder',
    bio: 'Ex-Google engineer. Building scalable systems and delightful user experiences.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  },
  {
    name: 'David Kim',
    role: 'Head of Design',
    bio: 'Previously at Figma. Believes great design can change the world.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
  },
  {
    name: 'Sarah Chen',
    role: 'Head of Growth',
    bio: 'Built communities at Notion and Linear. Connecting people is her superpower.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
  },
];

const milestones = [
  { year: '2022', event: 'CollabHub founded in San Francisco' },
  { year: '2023', event: 'Launched beta with 100 startups' },
  { year: '2023', event: 'Reached 10,000 users' },
  { year: '2024', event: 'Series A funding raised' },
  { year: '2024', event: 'Expanded to 50+ countries' },
];

export function AboutPage() {
  return (
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedContainer variant="slide-up">
              <Badge variant="secondary" className="mb-6">
                <Globe className="w-3 h-3 mr-1" />
                Our Story
              </Badge>
            </AnimatedContainer>

            <AnimatedContainer variant="slide-up" delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Building the Future of{' '}
                <span className="gradient-text">Work</span>
              </h1>
            </AnimatedContainer>

            <AnimatedContainer variant="slide-up" delay={0.2}>
              <p className="text-lg text-muted-foreground">
                CollabHub was born from a simple belief: the best companies are built when 
                the right people come together at the right time. We&apos;re on a mission to make 
                that connection happen for every founder, talent, and investor in the world.
              </p>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <AnimatedContainer variant="slide-right">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-2xl" />
                <div className="relative grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="bg-card border rounded-2xl p-6">
                      <Quote className="w-8 h-8 text-primary mb-4" />
                      <p className="text-sm text-muted-foreground">
                        &ldquo;We started CollabHub because we saw too many great ideas fail 
                        simply because founders couldn&apos;t find the right team.&rdquo;
                      </p>
                    </div>
                    <img
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop"
                      alt="Team collaboration"
                      className="rounded-2xl object-cover h-48 w-full"
                    />
                  </div>
                  <div className="space-y-4 pt-8">
                    <img
                      src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop"
                      alt="Office space"
                      className="rounded-2xl object-cover h-48 w-full"
                    />
                    <div className="bg-primary text-primary-foreground rounded-2xl p-6">
                      <div className="text-3xl font-bold mb-2">50K+</div>
                      <div className="text-sm opacity-80">Successful connections made</div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedContainer>

            <AnimatedContainer variant="slide-left">
              <div>
                <h2 className="text-3xl font-bold mb-4">
                  Our Journey
                </h2>
                <p className="text-muted-foreground mb-6">
                  It all started in a small coffee shop in San Francisco. Two friends, both 
                  founders themselves, frustrated by how hard it was to find the right people 
                  to build their vision.
                </p>
                <p className="text-muted-foreground mb-6">
                  They realized that the problem wasn&apos;t a lack of talent or ideas—it was 
                  the disconnect between them. Great founders with amazing ideas couldn&apos;t 
                  find skilled people who shared their passion. Talented professionals 
                  struggled to discover startups aligned with their values.
                </p>
                <p className="text-muted-foreground mb-8">
                  So they built CollabHub—a platform designed to bridge that gap, to make 
                  meaningful connections that lead to extraordinary companies.
                </p>
                <Button asChild>
                  <Link to="/contact">
                    Join Our Team
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Our Values
            </h2>
            <p className="text-lg text-muted-foreground">
              The principles that guide everything we do at CollabHub.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <AnimatedContainer key={index} variant="scale" delay={index * 0.1}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              </AnimatedContainer>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Meet the Team
            </h2>
            <p className="text-lg text-muted-foreground">
              Passionate builders working to empower the next generation of startups.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {team.map((member, index) => (
              <AnimatedContainer key={index} variant="slide-up" delay={index * 0.1}>
                <div className="text-center">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                  />
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-primary text-sm mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </div>
              </AnimatedContainer>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Our Milestones
            </h2>
            <p className="text-lg text-muted-foreground">
              Key moments in our journey so far.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              {milestones.map((milestone, index) => (
                <AnimatedContainer key={index} variant="slide-right" delay={index * 0.1}>
                  <div className="relative flex items-start gap-8 mb-8 last:mb-0">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 relative z-10">
                      <div className="w-3 h-3 rounded-full bg-primary-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-primary mb-1">
                        {milestone.year}
                      </div>
                      <div className="text-foreground">{milestone.event}</div>
                    </div>
                  </div>
                </AnimatedContainer>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative px-8 py-16 lg:px-16 lg:py-24 text-center">
              <Users className="w-12 h-12 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Join Our Community
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Be part of a growing community of founders, talents, and investors 
                building the future together.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/20 hover:bg-primary-foreground/10" asChild>
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
