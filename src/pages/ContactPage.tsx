import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { AnimatedContainer } from '@/components/shared/AnimatedContainer';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Send,
  CheckCircle2,
  Clock,
  Users,
  Building2
} from 'lucide-react';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email',
    description: 'support@collabhub.com',
    action: 'Send email',
    href: 'mailto:support@collabhub.com',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Available 9am - 6pm PST',
    action: 'Start chat',
    href: '#',
  },
  {
    icon: Phone,
    title: 'Phone',
    description: '+1 (555) 123-4567',
    action: 'Call now',
    href: 'tel:+15551234567',
  },
];

const offices = [
  {
    city: 'San Francisco',
    address: '123 Startup Street, SF, CA 94102',
    image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=250&fit=crop',
  },
  {
    city: 'New York',
    address: '456 Innovation Ave, NY, NY 10001',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=250&fit=crop',
  },
];

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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
                <MessageSquare className="w-3 h-3 mr-1" />
                Get in Touch
              </Badge>
            </AnimatedContainer>

            <AnimatedContainer variant="slide-up" delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                We&apos;d Love to Hear From You
              </h1>
            </AnimatedContainer>

            <AnimatedContainer variant="slide-up" delay={0.2}>
              <p className="text-lg text-muted-foreground">
                Have a question, feedback, or just want to say hello? 
                Our team is here to help you succeed.
              </p>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="pb-20 lg:pb-32">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {contactMethods.map((method, index) => (
              <AnimatedContainer key={index} variant="scale" delay={index * 0.1}>
                <a
                  href={method.href}
                  className="block p-6 rounded-2xl bg-card border hover:shadow-lg transition-all duration-300 text-center group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <method.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{method.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{method.description}</p>
                  <span className="text-sm font-medium text-primary">{method.action}</span>
                </a>
              </AnimatedContainer>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Form */}
            <AnimatedContainer variant="slide-right">
              <div className="bg-card rounded-2xl border p-8">
                <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground">
                      We&apos;ll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="How can we help?"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us more about your inquiry..."
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" size="lg">
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                )}
              </div>
            </AnimatedContainer>

            {/* Info */}
            <AnimatedContainer variant="slide-left">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    Why Reach Out?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    We&apos;re here to help with any questions about CollabHub, 
                    whether you&apos;re a founder looking for talent, a professional 
                    seeking opportunities, or an investor exploring startups.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Fast Response</h3>
                      <p className="text-sm text-muted-foreground">
                        We typically respond within 24 hours during business days.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Dedicated Support</h3>
                      <p className="text-sm text-muted-foreground">
                        Our team is passionate about helping you succeed.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Enterprise Inquiries</h3>
                      <p className="text-sm text-muted-foreground">
                        For enterprise solutions, mention it in your message.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-primary/5 border border-primary/10">
                  <h3 className="font-semibold mb-2">Need Immediate Help?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Check our help center for answers to common questions.
                  </p>
                  <Button variant="outline" className="w-full">
                    Visit Help Center
                  </Button>
                </div>
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Our Offices
            </h2>
            <p className="text-muted-foreground">
              Come visit us! We&apos;d love to meet you in person.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {offices.map((office, index) => (
              <AnimatedContainer key={index} variant="scale" delay={index * 0.1}>
                <div className="rounded-2xl overflow-hidden border">
                  <img
                    src={office.image}
                    alt={office.city}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-lg">{office.city}</h3>
                    </div>
                    <p className="text-muted-foreground">{office.address}</p>
                  </div>
                </div>
              </AnimatedContainer>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
