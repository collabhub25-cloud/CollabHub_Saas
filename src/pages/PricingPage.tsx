import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AnimatedContainer } from '@/components/shared/AnimatedContainer';
import { pricingPlans } from '@/data/mockData';
import { Check, X, Sparkles, Zap, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  const getPrice = (basePrice: number) => {
    if (basePrice === 0) return 0;
    return isAnnual ? Math.round(basePrice * 0.8 * 12) : basePrice;
  };

  const getPeriodLabel = (basePrice: number) => {
    if (basePrice === 0) return 'forever';
    return isAnnual ? '/year' : '/month';
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedContainer variant="slide-up">
              <Badge variant="secondary" className="mb-6">
                <Sparkles className="w-3 h-3 mr-1" />
                Simple, transparent pricing
              </Badge>
            </AnimatedContainer>

            <AnimatedContainer variant="slide-up" delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Choose Your Plan
              </h1>
            </AnimatedContainer>

            <AnimatedContainer variant="slide-up" delay={0.2}>
              <p className="text-lg text-muted-foreground mb-8">
                Start free and scale as you grow. No hidden fees, cancel anytime.
              </p>
            </AnimatedContainer>

            {/* Toggle */}
            <AnimatedContainer variant="slide-up" delay={0.3}>
              <div className="flex items-center justify-center gap-4">
                <span className={cn('text-sm', !isAnnual && 'text-muted-foreground')}>
                  Monthly
                </span>
                <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
                <span className={cn('text-sm', isAnnual && 'text-muted-foreground')}>
                  Annual
                </span>
                {isAnnual && (
                  <Badge variant="secondary" className="text-xs">
                    Save 20%
                  </Badge>
                )}
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 lg:pb-32">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <AnimatedContainer
                key={plan.id}
                variant="scale"
                delay={index * 0.1}
              >
                <div
                  className={cn(
                    'relative rounded-2xl p-8 h-full flex flex-col',
                    plan.isPopular
                      ? 'bg-primary text-primary-foreground border-0 shadow-glow'
                      : 'bg-card border'
                  )}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary-foreground text-primary">
                        <Zap className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p
                      className={cn(
                        'text-sm',
                        plan.isPopular ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      )}
                    >
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${getPrice(plan.price)}
                      </span>
                      <span
                        className={cn(
                          'text-sm',
                          plan.isPopular ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        )}
                      >
                        {getPeriodLabel(plan.price)}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check
                          className={cn(
                            'w-5 h-5 flex-shrink-0',
                            plan.isPopular ? 'text-primary-foreground' : 'text-primary'
                          )}
                        />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.isPopular ? 'secondary' : 'default'}
                    className="w-full"
                    asChild
                  >
                    <Link to="/signup">{plan.cta}</Link>
                  </Button>
                </div>
              </AnimatedContainer>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Compare Plans
            </h2>

            <div className="bg-card rounded-2xl border overflow-hidden">
              <div className="grid grid-cols-4 gap-4 p-6 border-b bg-muted/50">
                <div className="font-semibold">Feature</div>
                <div className="text-center font-semibold">Free</div>
                <div className="text-center font-semibold text-primary">Pro</div>
                <div className="text-center font-semibold">Enterprise</div>
              </div>

              {[
                { name: 'Profile creation', free: true, pro: true, enterprise: true },
                { name: 'Browse startups', free: true, pro: true, enterprise: true },
                { name: 'Applications per month', free: '3', pro: 'Unlimited', enterprise: 'Unlimited' },
                { name: 'Priority messaging', free: false, pro: true, enterprise: true },
                { name: 'Advanced analytics', free: false, pro: true, enterprise: true },
                { name: 'Verified badge', free: false, pro: true, enterprise: true },
                { name: 'Portfolio showcase', free: false, pro: true, enterprise: true },
                { name: 'Team collaboration', free: false, pro: false, enterprise: true },
                { name: 'API access', free: false, pro: false, enterprise: true },
                { name: 'Dedicated support', free: false, pro: 'Priority', enterprise: 'Dedicated' },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-4 p-4 border-b last:border-b-0 items-center"
                >
                  <div className="text-sm">{feature.name}</div>
                  <div className="text-center">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check className="w-5 h-5 text-primary mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-sm">{feature.free}</span>
                    )}
                  </div>
                  <div className="text-center bg-primary/5 -my-4 py-4">
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? (
                        <Check className="w-5 h-5 text-primary mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-sm font-medium">{feature.pro}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {typeof feature.enterprise === 'boolean' ? (
                      feature.enterprise ? (
                        <Check className="w-5 h-5 text-primary mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-sm">{feature.enterprise}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              {[
                {
                  q: 'Can I switch plans at any time?',
                  a: 'Yes, you can upgrade or downgrade your plan at any time. Changes will take effect at the start of your next billing cycle.',
                },
                {
                  q: 'Is there a free trial for Pro?',
                  a: 'Yes, we offer a 14-day free trial of our Pro plan. No credit card required to start.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.',
                },
                {
                  q: 'Can I get a refund?',
                  a: 'We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.',
                },
                {
                  q: 'Do you offer discounts for startups?',
                  a: 'Yes! We offer special pricing for early-stage startups and non-profits. Contact our sales team to learn more.',
                },
              ].map((faq, index) => (
                <div key={index} className="p-6 rounded-xl bg-card border">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Building2 className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Need a Custom Plan?
            </h2>
            <p className="text-muted-foreground mb-8">
              Contact our sales team for custom enterprise solutions tailored to your organization&apos;s needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/signup">Get Started Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
