import { Button } from "../ui/button";
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import countryList from 'react-select-country-list'
import Select from 'react-select'
import type { SingleValue, CSSObjectWithLabel } from 'react-select'
import { useMemo } from 'react'

interface CountryOption {
  label: string;
  value: string;
}

interface GameOption {
  label: string;
  value: string;
}
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet"
import { useGamesAnalytics } from "../../backend/analytics.service"

interface FilterState {
  registrationDates: {
    startDate: string;
    endDate: string;
  };
  sessionCount: string;
  timePlayed: {
    min: number;
    max: number;
  };
  gameTitle: string;
  gameCategory: string;
  sortByMaxTimePlayed: boolean;
  country: string;
}

interface UserManagementFilterSheetProps {
  children: React.ReactNode;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
}

export function UserManagementFilterSheet({ 
  children, 
  filters, 
  onFiltersChange,
  onReset 
}: UserManagementFilterSheetProps) {
  const { data: games } = useGamesAnalytics();
  
  // Get unique categories from games
  const categories = [...new Set(games?.map(game => game.category?.name).filter(Boolean))];
  
  // Get game titles and transform them into options
  const gameOptions = useMemo(() => 
    (games?.map(game => game.title) || [])
      .map(title => ({ label: title, value: title })),
    [games]
  );

  // Create memoized countries list
  const countries = useMemo(() => countryList().getData(), []);

  const handleChange = (field: keyof FilterState, value: unknown) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children} 
      </SheetTrigger>
      <SheetContent className="font-boogaloo dark:bg-[#0F1621] overflow-y-auto overflow-x-hidden">
        <SheetHeader>
          <SheetTitle className="text-xl font-normal tracking-wider mt-6">Filter</SheetTitle>
          <div className="border border-b-gray-200"></div>
        </SheetHeader>
        <div className="grid gap-4 px-4">
          {/* Registration Dates */}
          <div className="flex flex-col space-y-2">
            <Label className="text-lg">Registration Dates</Label>
            <div className="flex gap-2">
              <Input 
                type="date" 
                value={filters.registrationDates.startDate}
                onChange={(e) => handleChange('registrationDates', {
                  ...filters.registrationDates,
                  startDate: e.target.value
                })}
                className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 text-gray-400 font-thin font-pincuk text-xl tracking-wider dark:bg-[#121C2D]" 
              />
              <Input 
                type="date" 
                value={filters.registrationDates.endDate}
                onChange={(e) => handleChange('registrationDates', {
                  ...filters.registrationDates,
                  endDate: e.target.value
                })}
                className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 text-gray-400 font-thin font-pincuk text-xl tracking-wider dark:bg-[#121C2D]" 
              />
            </div>
          </div>

          {/* Session Count */}
          <div className="flex flex-col space-y-2">
            <Label className="text-lg">Session Count</Label>
            <Input 
              type="number"
              min="0"
              value={filters.sessionCount}
              onChange={(e) => handleChange('sessionCount', e.target.value)}
              placeholder="Minimum sessions"
              className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 text-gray-400 font-thin font-pincuk text-xl tracking-wider dark:bg-[#121C2D]"
            />
          </div>

          {/* Time Played (in minutes) */}
          <div className="flex flex-col space-y-2">
            <Label className="text-lg">Time Played (minutes)</Label>
            <div className="flex gap-2">
              <Input 
                type="number"
                min="0"
                value={filters.timePlayed.min === 0 ? '' : filters.timePlayed.min}
                onChange={(e) => handleChange('timePlayed', {
                  ...filters.timePlayed,
                  min: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0
                })}
                placeholder="Min minutes"
                className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 text-gray-400 font-thin font-pincuk text-xl tracking-wider dark:bg-[#121C2D]"
              />
              <Input 
                type="number"
                min={filters.timePlayed.min}
                value={filters.timePlayed.max === 0 ? '' : filters.timePlayed.max}
                onChange={(e) => handleChange('timePlayed', {
                  ...filters.timePlayed,
                  max: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0
                })}
                placeholder="Max minutes"
                className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 text-gray-400 font-thin font-pincuk text-xl tracking-wider dark:bg-[#121C2D]"
              />
            </div>
          </div>

          {/* Game Category */}
          <div className="flex flex-col space-y-2">
            <Label className="text-lg">Game Category</Label>
            <select 
              value={filters.gameCategory}
              onChange={(e) => handleChange('gameCategory', e.target.value)}
              className="bg-[#F1F5F9] border border-[#CBD5E0] h-14 px-3 text-gray-400 font-thin font-pincuk text-xl tracking-wider rounded dark:bg-[#121C2D]"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Game Title */}
          <div className="flex flex-col space-y-2">
            <Label className="text-lg">Game Title</Label>
            <Select<GameOption>
              options={gameOptions}
              value={gameOptions.find(game => game.value === filters.gameTitle)}
              onChange={(option: SingleValue<GameOption>) => handleChange('gameTitle', option ? option.value : '')}
              className="bg-[#F1F5F9] text-gray-400 font-thin font-pincuk text-xl tracking-wider dark:bg-[#121C2D]"
              classNamePrefix="react-select"
              placeholder="Select a game..."
              isClearable
              styles={{
                control: (base: CSSObjectWithLabel) => ({
                  ...base,
                  height: '42px',
                  borderColor: '#CBD5E0',
                  backgroundColor: '#F1F5F9 dark:bg-[#121C2D]',
                  '&:hover': {
                    borderColor: '#CBD5E0'
                  }
                }),
                menu: (base: CSSObjectWithLabel) => ({
                  ...base,
                  backgroundColor: '#F1F5F9',
                  '.dark &': {
                    backgroundColor: '#121C2D'
                  }
                }),
                option: (base: CSSObjectWithLabel, { isFocused }: { isFocused: boolean }) => ({
                  ...base,
                  backgroundColor: isFocused ? '#E2E8F0' : 'transparent',
                  '&:hover': {
                    backgroundColor: '#E2E8F0'
                  },
                  '.dark &': {
                    backgroundColor: isFocused ? '#1E293B' : 'transparent',
                    '&:hover': {
                      backgroundColor: '#1E293B '
                    }
                  }
                })
              }}
            />
          </div>
          {/* Select country */}
          <div className="flex flex-col space-y-2">
            <Label className="text-lg">Select Country</Label>
            <Select<CountryOption>
              options={countries}
              value={countries.find(country => country.value === filters.country)}
              onChange={(option: SingleValue<CountryOption>) => handleChange('country', option ? option.value : '')}
              className="bg-[#F1F5F9] text-gray-400 font-thin font-pincuk text-xl tracking-wider dark:bg-[#121C2D]"
              classNamePrefix="react-select"
              placeholder="Select a country..."
              isClearable
              styles={{
                control: (base: CSSObjectWithLabel) => ({
                  ...base,
                  height: '42px',
                  borderColor: '#CBD5E0',
                  backgroundColor: '#F1F5F9 dark:bg-[#121C2D]',
                  '&:hover': {
                    borderColor: '#CBD5E0'
                  }
                }),
                menu: (base: CSSObjectWithLabel) => ({
                  ...base,
                  backgroundColor: '#F1F5F9',
                  '.dark &': {
                    backgroundColor: '#121C2D'
                  }
                }),
                option: (base: CSSObjectWithLabel, { isFocused }: { isFocused: boolean }) => ({
                  ...base,
                  backgroundColor: isFocused ? '#E2E8F0' : 'transparent',
                  '&:hover': {
                    backgroundColor: '#E2E8F0'
                  },
                  '.dark &': {
                    backgroundColor: isFocused ? '#1E293B' : 'transparent',
                    '&:hover': {
                      backgroundColor: '#1E293B'
                    }
                  }
                })
              }}
            />
          </div>

          {/* Sort by Max Time Played */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sortByMaxTimePlayed"
              className="w-4 h-4"
              checked={filters.sortByMaxTimePlayed}
              onChange={(e) => handleChange('sortByMaxTimePlayed', e.target.checked)}
            />
            <Label htmlFor="sortByMaxTimePlayed" className="text-lg">Sort by Max Time Played</Label>
          </div>
          
         

        </div>

        <div className="flex gap-3 justify-end px-2 mb-4"> 
          <SheetClose asChild>
            <Button 
              type="button" 
              onClick={onReset}
              className="w-20 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-accent"
            >
              Reset
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button 
              type="button"
              className="w-20 h-12 bg-[#D946EF] dark:text-white hover:text-[#D946EF] hover:bg-[#F3E8FF]"
            >
              Filter
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
