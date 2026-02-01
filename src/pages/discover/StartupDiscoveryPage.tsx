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
import { 
  Search, 
  MapPin, 
  Users, 
  DollarSign,
  Bookmark,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { mockStartups, industries, locations } from '@/data/mockData';

const stages = ['idea', 'mvp', 'seed', 'series-a', 'series-b', 'growth'];

export function StartupDiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const filteredStartups = mockStartups.filter((startup) => {
    const matchesSearch = 
      startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = !selectedStage || startup.stage === selectedStage;
    const matchesIndustry = !selectedIndustry || startup.industry.includes(selectedIndustry);
    const matchesLocation = !selectedLocation || startup.location === selectedLocation;

    return matchesSearch && matchesStage && matchesIndustry && matchesLocation;
  });

  const hasActiveFilters = selectedStage || selectedIndustry || selectedLocation;

  const clearFilters = () => {
    setSelectedStage('');
    setSelectedIndustry('');
    setSelectedLocation('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimatedContainer variant="slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Discover Startups</h1>
            <p className="text-muted-foreground">
              Find innovative companies and investment opportunities
            </p>
          </div>
        </div>
      </AnimatedContainer>

      {/* Search and Filters */}
      <AnimatedContainer variant="slide-up" delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput
            placeholder="Search startups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            className="flex-1"
          />
          
          {/* Desktop Filters */}
          <div className="hidden md:flex gap-2">
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Stages</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Industries</SelectItem>
                {industries.slice(0, 10).map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[160px]">
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
                  <label className="text-sm font-medium mb-2 block">Stage</label>
                  <Select value={selectedStage} onValueChange={setSelectedStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Stages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Stages</SelectItem>
                      {stages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage.charAt(0).toUpperCase() + stage.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Industry</label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Industries</SelectItem>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
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
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedStage && (
              <Badge variant="secondary" className="gap-1">
                {selectedStage}
                <button onClick={() => setSelectedStage('')}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedIndustry && (
              <Badge variant="secondary" className="gap-1">
                {selectedIndustry}
                <button onClick={() => setSelectedIndustry('')}>
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
        {filteredStartups.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredStartups.map((startup) => (
              <Card key={startup.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-32">
                  <img
                    src={startup.coverImage}
                    alt={startup.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={startup.logo}
                        alt={startup.name}
                        className="w-14 h-14 rounded-lg border-2 border-white object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-white">{startup.name}</h3>
                        <p className="text-sm text-white/80">{startup.stage}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" className="flex-shrink-0">
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {startup.tagline}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {startup.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {startup.teamSize}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {startup.fundingRaised}
                    </span>
                  </div>

                  <SkillTagList skills={startup.industry} maxVisible={3} className="mb-4" />

                  <div className="flex gap-2">
                    <Button className="flex-1" asChild>
                      <Link to={`/startups/${startup.id}`}>View Profile</Link>
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No startups found"
            description="Try adjusting your filters or search query to find what you are looking for."
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
