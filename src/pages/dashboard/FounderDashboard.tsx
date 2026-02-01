import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedContainer } from '@/components/shared/AnimatedContainer';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { 
  Building2, 
  Users, 
  FileText, 
  MessageSquare, 
  Plus,
  ArrowRight,
  Eye,
  Briefcase,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { mockStartups, mockApplications, mockMessages, mockMilestones } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/utils';

const stats = [
  { label: 'Active Startups', value: '3', icon: Building2, change: '+1 this month' },
  { label: 'Team Members', value: '12', icon: Users, change: '+3 this month' },
  { label: 'Applications', value: '24', icon: FileText, change: '+8 this week' },
  { label: 'Messages', value: '8', icon: MessageSquare, change: '3 unread' },
];

export function FounderDashboard() {
  const { user } = useAuth();
  const myStartups = mockStartups.filter(s => s.founderId === user?.id);
  const myApplications = mockApplications.filter(a => 
    myStartups.some(s => s.id === a.startupId)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimatedContainer variant="slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name.split(' ')[0]}</h1>
            <p className="text-muted-foreground">
              Here&apos;s what&apos;s happening with your startups today.
            </p>
          </div>
          <Button asChild>
            <Link to="/startups/new">
              <Plus className="w-4 h-4 mr-2" />
              New Startup
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
          {/* My Startups */}
          <AnimatedContainer variant="slide-up" delay={0.2}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Startups</CardTitle>
                  <CardDescription>Manage your companies</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/startups">
                    View all
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myStartups.map((startup) => (
                    <div
                      key={startup.id}
                      className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <img
                        src={startup.logo}
                        alt={startup.name}
                        className="w-12 h-12 rounded-lg object-cover"
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
                            <p className="text-sm text-muted-foreground truncate">
                              {startup.tagline}
                            </p>
                          </div>
                          <StatusBadge status={startup.status} />
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {startup.teamSize}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {startup.roles.length} roles
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            1.2k views
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          {/* Recent Applications */}
          <AnimatedContainer variant="slide-up" delay={0.3}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>Review talent applications</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/applications">
                    View all
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myApplications.slice(0, 3).map((application) => (
                    <div
                      key={application.id}
                      className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <UserAvatar user={application.talent} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{application.talent.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Applied for {application.role.title}
                            </p>
                          </div>
                          <StatusBadge status={application.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          &ldquo;{application.coverLetter}&rdquo;
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button size="sm" variant="outline">
                            View Profile
                          </Button>
                          <Button size="sm">
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Upcoming Milestones */}
          <AnimatedContainer variant="slide-up" delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMilestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{milestone.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {new Date(milestone.dueDate).toLocaleDateString()}
                        </p>
                        <StatusBadge status={milestone.status} className="mt-1 text-[10px]" />
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm">
                  View All Milestones
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
                <Badge variant="secondary">3 new</Badge>
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
                    <Link to="/startups/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Startup
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/roles/new">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Post a New Role
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/discover/talents">
                      <Users className="w-4 h-4 mr-2" />
                      Browse Talent
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/analytics">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Analytics
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
