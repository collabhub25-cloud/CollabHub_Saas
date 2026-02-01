import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedContainer } from '@/components/shared/AnimatedContainer';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkillTagList } from '@/components/shared/SkillTag';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { 
  Search, 
  FileText, 
  Bookmark, 
  MessageSquare, 
  Briefcase,
  ArrowRight,
  Building2,
  MapPin,
  TrendingUp,
  Star
} from 'lucide-react';
import { mockStartups, mockApplications, mockMessages, mockRoles } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/utils';

const stats = [
  { label: 'Applications', value: '8', icon: FileText, change: '3 pending' },
  { label: 'Saved', value: '12', icon: Bookmark, change: '4 new this week' },
  { label: 'Messages', value: '5', icon: MessageSquare, change: '2 unread' },
  { label: 'Profile Views', value: '47', icon: TrendingUp, change: '+12 this week' },
];

export function TalentDashboard() {
  const { user } = useAuth();
  const myApplications = mockApplications.filter(a => a.talentId === user?.id);
  const recommendedStartups = mockStartups.slice(0, 3);
  const recentRoles = mockRoles.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimatedContainer variant="slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name.split(' ')[0]}</h1>
            <p className="text-muted-foreground">
              Discover your next opportunity and track your applications.
            </p>
          </div>
          <Button asChild>
            <Link to="/discover/startups">
              <Search className="w-4 h-4 mr-2" />
              Browse Startups
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
                  <CardTitle>Recommended for You</CardTitle>
                  <CardDescription>Startups matching your skills</CardDescription>
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
                          <Button size="sm" variant="outline">
                            <Bookmark className="w-4 h-4" />
                          </Button>
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
                            {startup.teamSize} members
                          </span>
                        </div>
                        <SkillTagList 
                          skills={startup.industry} 
                          maxVisible={3}
                          className="mt-3"
                        />
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" asChild>
                            <Link to={`/startups/${startup.id}`}>
                              View Details
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline">
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          {/* Recent Openings */}
          <AnimatedContainer variant="slide-up" delay={0.3}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Openings</CardTitle>
                  <CardDescription>New roles posted this week</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/discover/roles">
                    View all
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {recentRoles.map((role) => (
                    <div
                      key={role.id}
                      className="p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{role.title}</h3>
                        <StatusBadge status={role.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {mockStartups.find(s => s.id === role.startupId)?.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {role.location}
                        </span>
                        {role.isRemote && (
                          <Badge variant="secondary" className="text-[10px]">Remote</Badge>
                        )}
                      </div>
                      {role.salary && (
                        <p className="text-sm font-medium text-primary mt-2">
                          {role.salary}
                        </p>
                      )}
                      <SkillTagList 
                        skills={role.skills} 
                        maxVisible={3}
                        className="mt-3"
                      />
                      <Button size="sm" className="w-full mt-3">
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          {/* My Applications */}
          <AnimatedContainer variant="slide-up" delay={0.4}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Applications</CardTitle>
                  <CardDescription>Track your application status</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/applications">
                    View all
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {myApplications.length > 0 ? (
                  <div className="space-y-4">
                    {myApplications.map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center gap-4 p-4 rounded-lg border"
                      >
                        <img
                          src={application.startup.logo}
                          alt={application.startup.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{application.role.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {application.startup.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={application.status} />
                          <p className="text-xs text-muted-foreground mt-1">
                            Applied {formatRelativeTime(application.appliedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No applications yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start browsing startups and apply to roles that interest you.
                    </p>
                    <Button asChild>
                      <Link to="/discover/startups">Browse Startups</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedContainer>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Profile Completion */}
          <AnimatedContainer variant="slide-up" delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle>Profile Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${0.75 * 226} 226`}
                        className="text-primary"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">75%</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Almost there!</p>
                    <p className="text-sm text-muted-foreground">
                      Complete your profile to increase visibility.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center">
                      <Star className="w-3 h-3 text-success-foreground" />
                    </div>
                    <span>Basic information</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center">
                      <Star className="w-3 h-3 text-success-foreground" />
                    </div>
                    <span>Skills & experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-muted" />
                    <span className="text-muted-foreground">Portfolio links</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-muted" />
                    <span className="text-muted-foreground">Resume upload</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/profile">Complete Profile</Link>
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
                    <Link to="/profile">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Update Profile
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/discover/startups">
                      <Search className="w-4 h-4 mr-2" />
                      Browse Startups
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/saved">
                      <Bookmark className="w-4 h-4 mr-2" />
                      View Saved
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
