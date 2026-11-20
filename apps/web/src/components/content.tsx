import { cn } from "../lib/utils"

function Content({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card"
            className={cn(
                "bg-card text-card-foreground flex flex-col gap-6 py-1 items-center",
                className
            )}
            {...props}
        />
    )
}

export { Content }