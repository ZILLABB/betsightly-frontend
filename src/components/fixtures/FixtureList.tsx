import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, RefreshCw, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../common/Button';
import { Calendar } from '../common/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../common/Popover';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Fixture, getFixtures } from '../../services/multiSourceFixtureService';
import NoDataState from '../common/NoDataState';
import { cn } from '../../utils/cn';

interface FixtureListProps {
  initialDate?: Date;
}

const FixtureList: React.FC<FixtureListProps> = ({ initialDate = new Date() }) => {
  const [date, setDate] = useState<Date>(initialDate);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterLeague, setFilterLeague] = useState<string>('');
  const [leagues, setLeagues] = useState<string[]>([]);

  const fetchFixturesForDate = async (selectedDate: Date, forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const fixtureList = await getFixtures(formattedDate, forceRefresh);
      
      setFixtures(fixtureList.fixtures);
      setDataSource(fixtureList.source);
      
      // Extract unique leagues for filtering
      const uniqueLeagues = Array.from(new Set(fixtureList.fixtures.map(fixture => fixture.league)));
      setLeagues(uniqueLeagues);
      
      if (fixtureList.fixtures.length === 0) {
        setError(`No fixtures found for ${formattedDate}`);
      }
    } catch (err) {
      console.error('Error fetching fixtures:', err);
      setError('Failed to load fixtures. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixturesForDate(date);
  }, [date]);

  const handleRefresh = () => {
    fetchFixturesForDate(date, true);
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
    }
  };

  // Filter fixtures based on search query and league filter
  const filteredFixtures = fixtures.filter(fixture => {
    const matchesSearch = searchQuery === '' || 
      fixture.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fixture.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fixture.league.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLeague = filterLeague === '' || fixture.league === filterLeague;
    
    return matchesSearch && matchesLeague;
  });

  // Group fixtures by league
  const fixturesByLeague = filteredFixtures.reduce<Record<string, Fixture[]>>((acc, fixture) => {
    if (!acc[fixture.league]) {
      acc[fixture.league] = [];
    }
    acc[fixture.league].push(fixture);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Fixtures</h2>
          <p className="text-[var(--muted-foreground)]">
            Browse fixtures for {format(date, 'MMMM d, yyyy')}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <CalendarIcon size={16} />
                {format(date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>
      
      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Search teams or leagues..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter size={16} />
              {filterLeague || "All Leagues"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <div className="p-2">
              <div 
                className={`px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--accent)] ${filterLeague === '' ? 'bg-[var(--accent)]' : ''}`}
                onClick={() => setFilterLeague('')}
              >
                All Leagues
              </div>
              {leagues.map(league => (
                <div 
                  key={league}
                  className={`px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--accent)] ${filterLeague === league ? 'bg-[var(--accent)]' : ''}`}
                  onClick={() => setFilterLeague(league)}
                >
                  {league}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Data source badge */}
      {dataSource && (
        <div className="flex justify-end">
          <Badge variant="outline" className="text-xs">
            Data Source: {dataSource}
          </Badge>
        </div>
      )}
      
      {/* Fixtures content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </div>
      ) : error ? (
        <NoDataState
          title="No Fixtures Available"
          message={error}
          showRefresh={true}
          showSettings={true}
          onRefresh={handleRefresh}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(fixturesByLeague).map(([league, leagueFixtures]) => (
            <Card key={league}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{league}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leagueFixtures.map(fixture => (
                    <div 
                      key={fixture.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-[var(--secondary)]/10 hover:bg-[var(--secondary)]/20 transition-colors"
                    >
                      <div className="flex-1 text-right pr-3">{fixture.homeTeam}</div>
                      <div className="px-3 py-1 rounded bg-[var(--card)] text-center min-w-[80px]">
                        {new Date(fixture.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex-1 pl-3">{fixture.awayTeam}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FixtureList;
