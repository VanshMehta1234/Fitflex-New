import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)} // reduced padding
      classNames={{
        months: "flex flex-col space-y-3", // less vertical gap
        month: "space-y-3",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_icon: "h-4 w-4",

        // Weekday row
        head_row: "grid grid-cols-7",
        head_cell:
          "text-center text-[0.75rem] font-semibold text-muted-foreground w-8 h-7",

        // Date rows
        row: "grid grid-cols-7",
        cell:
          "text-center text-sm relative h-8 w-8 flex items-center justify-center",

        // Day buttons slightly smaller
        day:
          "h-7 w-7 p-0 font-normal rounded hover:bg-accent hover:text-accent-foreground focus:outline-none",

        day_selected: "bg-primary text-white",
        day_today: "border border-primary",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-gray-400 opacity-40",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
