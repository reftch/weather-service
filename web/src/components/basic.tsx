import { ChevronDownIcon } from "lucide-react";
import type { City } from "../lib/model";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import CityPanel from "./citypanel";
import { Skeleton } from "./ui/skeleton";

function BasicCard({ city }: { city: City }) {
    return (
        <Card className="w-full">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b  sm:flex-row">
                <div className="grid flex-1 gap-1 px-3">
                    <CardTitle className="text-xl">{city.city}</CardTitle>
                    <CardDescription>{city.state ? `${city.state}, ${city.country}` : city.country}</CardDescription>
                </div>
                <div className="px-3">{new Date().toLocaleString('de')}</div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
                <div className="px-3 text-2xl pb-3">{city?.current.temperature_2m}°</div>
                <Collapsible className="rounded-md data-[state=open]:bg-muted">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="group">
                            Place details
                            <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex flex-col items-start gap-2 p-2.5 pt-0 text-sm">
                        <div>
                            <CityPanel city={city} />
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    )
}

function SkeletonCard() {
    return (
        <Card className="w-full">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b  sm:flex-row">
                <div className="grid flex-1 gap-1 px-3">
                    <Skeleton className="h-6 w-30" />
                    <Skeleton className="h-6 w-40" />
                </div>
                <div className="px-3">{new Date().toLocaleString('de')}</div>
            </CardHeader>
            <CardContent className="items-center">
                <Skeleton className="ml-3 h-19 w-20" />
            </CardContent>
        </Card>
    )
}

export { BasicCard, SkeletonCard };