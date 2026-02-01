import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedContainer } from '@/components/shared/AnimatedContainer';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkillTagList } from '@/components/shared/SkillTag';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { 
  MapPin, 
  Globe, 
  Linkedin, 
  Twitter,
  Users,
  Calendar,
  DollarSign,
  Briefcase,
  Bookmark,
  Share2,
  MessageSquare,
  ExternalLink,
  Target,
  CheckCircle2
} from 'lucide-react';
import { mockStartups, mockRoles, mockMilestones, mockTeamMembers } from '@/data/mockData';

export function StartupProfilePage() {
  const { id } = useParams<{ id: string }>();
  const startup = mockStartups.find(s => s.id === id);

  if (!startup) {
    return (
      <EmptyState
        icon={Target}
        title="Startup not found"
        description="The startup you are looking for does not exist or has been removed."
        action={{
          label: 'Browse Startups',
          onClick: () => window.location.href = '/discover/startups'
        }}
        className="py-20"
      />
    );
  }

  const startupRoles = mockRoles.filter(r => r.startupId === startup.id);
  const startupMilestones = mockMilestones.filter(m => m.startupId === startup.id);
  const startupTeam = mockTeamMembers.filter(t => t.startupId === startup.id);

  return (
    <div className="space-y-8">
      {/* Cover Image */}
      <AnimatedContainer variant="slide-up">
        <div className="relative h-64 rounded-2xl overflow-hidden">
          <img
            src={startup.coverImage}
            alt={startup.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end gap-6">
              <img
                src={startup.logo}
                alt={startup.name}
                className="w-24 h-24 rounded-2xl border-4 border-background object-cover"
              />
              <div className="flex-1 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{startup.name}</h1>
                  {startup.isVerified && (
                    <Badge className="bg-white/20 text-white border-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-white/80 text-lg">{startup.tagline}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="icon">
                  <Bookmark className="w-5 h-5" />
                </Button>
                <Button variant="secondary" size="icon">
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AnimatedContainer>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatedContainer variant="slide-up" delay={0.1}>
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="roles">Open Roles ({startupRoles.length})</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">About {startup.name}</h2>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {startup.description}
                    </p>

                    <div className="grid sm:grid-cols-2 gap-6 mt-8">
                      <div>
                        <h3 className="font-semibold mb-3">Industry</h3>
                        <SkillTagList skills={startup.industry} maxVisible={10} />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-3">Details</h3>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {startup.location}
                          </li>
                          <li className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Founded {new Date(startup.foundedDate).toLocaleDateString()}
                          </li>
                          <li className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {startup.teamSize} team members
                          </li>
                          <li className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="w-4 h-4" />
                            {startup.fundingRaised} raised
                          </li>
                          <li className="flex items-center gap-2 text-muted-foreground">
                            <Briefcase className="w-4 h-4" />
                            {startup.stage} stage
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="roles" className="mt-6">
                <div className="space-y-4">
                  {startupRoles.length > 0 ? (
                    startupRoles.map((role) => (
                      <Card key={role.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{role.title}</h3>
                              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {role.location}
                                </span>
                                {role.isRemote && (
                                  <Badge variant="secondary">Remote</Badge>
                                )}
                                <StatusBadge status={role.status} />
                              </div>
                            </div>
                            <Button>Apply Now</Button>
                          </div>
                          
                          <p className="text-muted-foreground mt-4">{role.description}</p>
                          
                          {role.salary && (
                            <p className="text-sm font-medium text-primary mt-4">
                              Salary: {role.salary}
                            </p>
                          )}
                          
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Required Skills:</p>
                            <SkillTagList skills={role.skills} maxVisible={8} />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <EmptyState
                      icon={Briefcase}
                      title="No open roles"
                      description="This startup does not have any open positions at the moment."
                      className="py-12"
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="team" className="mt-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {startupTeam.length > 0 ? (
                    startupTeam.map((member) => (
                      <Card key={member.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <UserAvatar user={member.user} size="lg" />
                            <div>
                              <h3 className="font-semibold">{member.user.name}</h3>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <EmptyState
                      icon={Users}
                      title="Team information unavailable"
                      description="Team details will be updated soon."
                      className="py-12 col-span-2"
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="milestones" className="mt-6">
                <div className="space-y-4">
                  {startupMilestones.length > 0 ? (
                    startupMilestones.map((milestone) => (
                      <Card key={milestone.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{milestone.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {milestone.description}
                              </p>
                              <p className="text-sm text-muted-foreground mt-2">
                                Due: {new Date(milestone.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <StatusBadge status={milestone.status} />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <EmptyState
                      icon={Target}
                      title="No milestones yet"
                      description="This startup has not set any public milestones."
                      className="py-12"
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </AnimatedContainer>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <AnimatedContainer variant="slide-up" delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle>Connect</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {startup.website && (
                    <a
                      href={startup.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Globe className="w-5 h-5 text-primary" />
                      <span className="flex-1">Website</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                  {startup.linkedin && (
                    <a
                      href={startup.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Linkedin className="w-5 h-5 text-primary" />
                      <span className="flex-1">LinkedIn</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                  {startup.twitter && (
                    <a
                      href={startup.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Twitter className="w-5 h-5 text-primary" />
                      <span className="flex-1">Twitter</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer variant="slide-up" delay={0.3}>
            <Card>
              <CardHeader>
                <CardTitle>Founder</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <UserAvatar user={startup.founder} size="lg" />
                  <div>
                    <h3 className="font-semibold">{startup.founder.name}</h3>
                    <p className="text-sm text-muted-foreground">Founder & CEO</p>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Founder
                </Button>
              </CardContent>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer variant="slide-up" delay={0.4}>
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Stage</span>
                    <Badge variant="secondary">{startup.stage}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={startup.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Open Roles</span>
                    <span className="font-medium">{startupRoles.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </div>
      </div>
    </div>
  );
}
