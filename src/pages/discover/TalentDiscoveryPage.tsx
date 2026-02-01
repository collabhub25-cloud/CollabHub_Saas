import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AnimatedContainer } from '@/components/shared/AnimatedContainer';
import { SearchInput } from '@/components/shared/SearchInput';
import { SkillTagList } from '@/components/shared/SkillTag';
import { EmptyState } from '@/components/shared/EmptyState';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { 
  Search, 
  MapPin, 
  Briefcase,
  Bookmark,
  X,
  SlidersHorizontal,
  Clock,
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import { mockUsers, mockTalentProfiles, popularSkills, locations } from '@/data/mockData';

const experienceLevels = ['0-2 years', '3-5 years', '5-8 years', '8+ years'];
const availabilityOptions = ['immediate', '2weeks', '1month', 'negotiable'];

export function TalentDiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('');

  // Filter talent users
  const talentUsers = mockUsers.filter(u => u.role === 'talent');
  
  const filteredTalent = talentUsers.filter((user) => {
    const profile = mockTalentProfiles.find(p => p.userId === user.id);
    if (!profile) return false;

    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.bio.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSkill = !selectedSkill || profile.skills.includes(selectedSkill);
    const matchesExperience = !selectedExperience || profile.experience === selectedExperience;
    const matchesLocation = !selectedLocation || profile.location === selectedLocation;
    const matchesAvailability = !selectedAvailability || profile.availability === selectedAvailability;

    return matchesSearch && matchesSkill && matchesExperience && matchesLocation && matchesAvailability;
  });

  const hasActiveFilters = selectedSkill || selectedExperience || selectedLocation || selectedAvailability;

  const clearFilters = () => {
    setSelectedSkill('');
    setSelectedExperience('');
    setSelectedLocation('');
    setSelectedAvailability('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimatedContainer variant="slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Discover Talent</h1>
            <p className="text-muted-foreground">
              Find skilled professionals for your startup
            </p>
          </div>
        </div>
      </AnimatedContainer>

      {/* Search and Filters */}
      <AnimatedContainer variant="slide-up" delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput
            placeholder="Search by name, role, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            className="flex-1"
          />
          
          {/* Desktop Filters */}
          <div className="hidden md:flex gap-2">
            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Skills</SelectItem>
                {popularSkills.slice(0, 15).map((skill) => (
                  <SelectItem key={skill} value={skill}>
                    {skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedExperience} onValueChange={setSelectedExperience}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                {experienceLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {locations.slice(0, 10).map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">!</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Skill</label>
                  <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Skills" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Skills</SelectItem>
                      {popularSkills.map((skill) => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Experience</label>
                  <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Levels</SelectItem>
                      {experienceLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Availability</label>
                  <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      {availabilityOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option === 'immediate' ? 'Immediate' :
                           option === '2weeks' ? '2 weeks' :
                           option === '1month' ? '1 month' : 'Negotiable'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button variant="outline" className="w-full" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedSkill && (
              <Badge variant="secondary" className="gap-1">
                {selectedSkill}
                <button onClick={() => setSelectedSkill('')}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedExperience && (
              <Badge variant="secondary" className="gap-1">
                {selectedExperience}
                <button onClick={() => setSelectedExperience('')}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedLocation && (
              <Badge variant="secondary" className="gap-1">
                {selectedLocation}
                <button onClick={() => setSelectedLocation('')}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedAvailability && (
              <Badge variant="secondary" className="gap-1">
                {selectedAvailability}
                <button onClick={() => setSelectedAvailability('')}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            <button 
              onClick={clearFilters}
              className="text-sm text-primary hover:underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </AnimatedContainer>

      {/* Results */}
      <AnimatedContainer variant="slide-up" delay={0.2}>
        {filteredTalent.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredTalent.map((user) => {
              const profile = mockTalentProfiles.find(p => p.userId === user.id);
              if (!profile) return null;

              return (
                <Card key={user.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <UserAvatar user={user} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {user.name}
                              {user.isVerified && (
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              )}
                            </h3>
                            <p className="text-sm text-primary">{profile.title}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Bookmark className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {profile.bio}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {profile.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {profile.experience}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {profile.availability === 'immediate' ? 'Immediate' :
                             profile.availability === '2weeks' ? '2 weeks' :
                             profile.availability === '1month' ? '1 month' : 'Negotiable'}
                          </span>
                        </div>

                        <SkillTagList skills={profile.skills} maxVisible={4} className="mt-3" />

                        {profile.expectedSalary && (
                          <p className="text-sm font-medium text-primary mt-3">
                            <DollarSign className="w-4 h-4 inline mr-1" />
                            {profile.expectedSalary}
                          </p>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button className="flex-1" asChild>
                            <Link to={`/talents/${user.id}`}>View Profile</Link>
                          </Button>
                          <Button variant="outline" className="flex-1">
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No talent found"
            description="Try adjusting your filters or search query to find the right candidates."
            action={{
              label: 'Clear Filters',
              onClick: clearFilters,
            }}
            className="py-16"
          />
        )}
      </AnimatedContainer>
    </div>
  );
}
