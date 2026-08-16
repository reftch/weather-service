import { useEffect, useState } from "preact/compat";
import { cn } from "../lib/utils";
import { Field } from "./ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import type { City } from "../lib/model";
import { CoordinateValidator } from "../lib/validator";
import { getCities, getCity } from "../lib/api";

function HeaderTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "text-card-foreground text-3xl whitespace-nowrap",
        className
      )}
      {...props}
    />
  )
}

type HeaderSearchProps = React.ComponentProps<"div"> & {
  onSearch: (city: City) => void
}

function HeaderSearch({ className, onSearch, ...props }: HeaderSearchProps) {
  const [value, setValue] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [city] = useState<City>()
  const [cities, setCities] = useState<Array<City>>([])
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  // Filter cities based on input
  useEffect(() => {
    if (value.trim() === "") {
      setFilteredCities([]);
      setIsSearchOpen(false);
    } else {
      const filtered = cities.filter(city =>
        city.city.toLowerCase().includes(value.toLowerCase())
      );

      // Remove duplicates by ID
      const uniqueCities = filtered.filter((city, index, self) =>
        index === self.findIndex(c => c.id === city.id)
      );
      setFilteredCities(uniqueCities);
      if (uniqueCities.length > 0 && uniqueCities[0].city != value) {
        setIsSearchOpen(true);
      }
    }
  }, [value, cities]);

  useEffect(() => {
    if (isSearchOpen) {
      queueMicrotask(() => {
        const el = document.querySelector('#search-input') as HTMLInputElement;
        if (el) {
          el.focus();
        }
      });
    }
  }, [isSearchOpen]);

  const handleChange = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const value = input.value;
    setValue(value);

    // check on physical coordinates
    if (CoordinateValidator.validateStringCoordinates(value)) {
      const parsedCoord = CoordinateValidator.parseStringToCoordinate(value);
      if (parsedCoord) {
        const c = await getCity(parsedCoord);
        onSearch(c!);
      }
    } else if (value.length > 0) {
      const array = await getCities(input.value);
      setCities(array);
    }
  };

  const handleCitySelect = (city: City) => {
    setIsSearchOpen(false);
    setValue(city.city);
    onSearch(city);
  };

  return (
    <div
      data-slot="card"
      className={cn(
        "text-card-foreground",
        className
      )}
      {...props}
    >
      <Field orientation="horizontal">
        <InputGroup className="rounded">
          <InputGroupInput
            id="search-input"
            className="w-[20rem]"
            type="search"
            placeholder="Search..."
            value={value}
            onInput={handleChange}
            // tabIndex={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearch(city!);
              }
            }}
          />
          <InputGroupAddon>
            <Popover open={isSearchOpen}>
              <PopoverTrigger asChild>
                <button className="invisible" tabIndex={-1} aria-hidden="true"></button>
              </PopoverTrigger>
              <PopoverContent align="start" className="mt-4 w-[20rem]">
                <div className="flex flex-col max-h-60 overflow-y-auto">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city: City) => (
                      <div
                        className="justify-start w-full p-1 hover:bg-muted cursor-pointer"
                        key={city.id}
                        tabIndex={-1}
                        onClick={() => handleCitySelect(city)}
                      >
                        <div className="flex flex-col w-full">
                          <div className="font-medium">{city.city}</div>
                          <div className="text-sm text-muted-foreground">
                            {[city.state, city.country].filter(Boolean).join(', ')}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-2 text-gray-500">No cities found</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </InputGroupAddon>

        </InputGroup>

        {/* <Button className="cursor-pointer" onClick={() => onSearch(city!)}>Search</Button> */}
      </Field>
    </div>
  )
}

function Header({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex justify-between gap-6 border-b py-4 items-center px-5",
        className
      )}
      {...props}
    />
  )
}

export { Header, HeaderSearch, HeaderTitle };

