import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedContainer } from '@/components/shared/AnimatedContainer';
import { SkillTagList } from '@/components/shared/SkillTag';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { 
  Search, 
  Bookmark, 
  MessageSquare, 
  TrendingUp,
  ArrowRight,
  Building2,
  MapPin,
  DollarSign,
  Users,
  Target,
  Eye,
  Briefcase,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { mockStartups, mockBookmarks, mockMessages } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/utils';

const stats = [
  { label: 'Saved Startups', value: '24', icon: Bookmark, change: '+5 this week' },
  { label: 'Contacts', value: '18', icon: Users, change: '3 new' },
  { label: 'Messages', value: '7', icon: MessageSquare, change: '2 unread' },
  { label: 'Deals Viewed', value: '156', icon: Eye, change: '+23 this week' },
];

const portfolioCompanies = [
  { name: 'TechFlow', stage: 'Series A', invested: '$500K', return: '+125%', logo: mockStartups[0].logo },
  { name: 'GreenEnergy', stage: 'Series B', invested: '$1.2M', return: '+85%', logo: mockStartups[1].logo },
];

export function InvestorDashboard() {
  const { user } = useAuth();
  const myBookmarks = mockBookmarks.filter(b => b.userId === user?.id);
  const recommendedStartups = mockStartups.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimatedContainer variant="slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name.split(' ')[0]}</h1>
            <p className="text-muted-foreground">
              Discover promising startups and track your investments.
            </p>
          </div>
          <Button asChild>
            <Link to="/discover/startups">
              <Search className="w-4 h-4 mr-2" />
              Discover Startups
            </Link>
          </Button>
        </div>
      </AnimatedContainer>

      {/* Stats */}
      <AnimatedContainer variant="slide-up" delay={0.1}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AnimatedContainer>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recommended Startups */}
          <AnimatedContainer variant="slide-up" delay={0.2}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Trending Startups</CardTitle>
                  <CardDescription>High-potential companies this week</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/discover/startups">
                    View all
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedStartups.map((startup) => (
                    <div
                      key={startup.id}
                      className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <img
                        src={startup.logo}
                        alt={startup.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {startup.name}
                              {startup.isVerified && (
                                <Badge variant="success" className="text-[10px]">Verified</Badge>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {startup.tagline}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Bookmark className="w-4 h-4" />
                            </Button>
                            <Button size="sm">
                              View Pitch
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {startup.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {startup.stage}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {startup.fundingRaised} raised
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {startup.teamSize}
                          </span>
                        </div>
                        <SkillTagList 
                          skills={startup.industry} 
                          maxVisible={4}
                          className="mt-3"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          {/* Portfolio Performance */}
          <AnimatedContainer variant="slide-up" delay={0.3}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Portfolio Performance</CardTitle>
                  <CardDescription>Track your investments</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/portfolio">
                    View all
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolioCompanies.map((company, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-lg border"
                    >
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{company.name}</h3>
                          <Badge variant="success" className="text-xs">
                            <TrendingUpIcon className="w-3 h-3 mr-1" />
                            {company.return}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{company.stage}</span>
                          <span>Invested: {company.invested}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-lg bg-muted">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Invested</span>
                    <span className="font-semibold">$1.7M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Portfolio Value</span>
                    <span className="font-semibold text-success">$3.2M (+88%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          {/* Saved Startups */}
          <AnimatedContainer variant="slide-up" delay={0.4}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Saved Startups</CardTitle>
                  <CardDescription>Companies you&apos;re tracking</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/saved">
                    View all
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {myBookmarks.slice(0, 4).map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <img
                        src={bookmark.startup.logo}
                        alt={bookmark.startup.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{bookmark.startup.name}</h3>
                        <p className="text-xs text-muted-foreground">{bookmark.startup.stage}</p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Investment Focus */}
          <AnimatedContainer variant="slide-up" delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Investment Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Stages</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Seed</Badge>
                      <Badge variant="secondary">Series A</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Sectors</p>
                    <SkillTagList 
                      skills={['AI/ML', 'SaaS', 'FinTech', 'HealthTech']} 
                      maxVisible={6}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Check Size</p>
                    <p className="font-medium">$500K - $2M</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm">
                  Edit Preferences
                </Button>
              </CardContent>
            </Card>
          </AnimatedContainer>

          {/* Recent Messages */}
          <AnimatedContainer variant="slide-up" delay={0.3}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messages
                </CardTitle>
                <Badge variant="secondary">2 new</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMessages.slice(0, 3).map((message) => (
                    <div
                      key={message.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <UserAvatar user={message.sender} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{message.sender.name}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {message.content}
                        </p>
                      </div>
                      {!message.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm" asChild>
                  <Link to="/messages">View All Messages</Link>
                </Button>
              </CardContent>
            </Card>
          </AnimatedContainer>

          {/* Quick Actions */}
          <AnimatedContainer variant="slide-up" delay={0.4}>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/discover/startups">
                      <Search className="w-4 h-4 mr-2" />
                      Discover Startups
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/portfolio">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Portfolio
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/saved">
                      <Bookmark className="w-4 h-4 mr-2" />
                      Saved Startups
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/deals">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Deal Flow
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </div>
      </div>
    </div>
  );
}
