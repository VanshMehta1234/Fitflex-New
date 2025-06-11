import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { Input } from "./input";
import { Label } from "./label";

interface TimePickerProps {
  time: string;
  setTime: (time: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function TimePicker({
  time,
  setTime,
  className,
  placeholder = "Select time",
  disabled = false,
}: TimePickerProps) {
  // Format time for display
  const formatTimeForDisplay = (time: string) => {
    if (!time) return "";
    
    try {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return time;
    }
  };

  // Convert to 12-hour format for editing
  const get12HourValues = () => {
    try {
      const [hours, minutes] = time.split(":");
      const hour24 = parseInt(hours, 10);
      const hour12 = hour24 % 12 || 12;
      const period = hour24 >= 12 ? 'PM' : 'AM';
      return {
        hour: hour12.toString().padStart(2, '0'),
        minute: minutes || "00",
        period
      };
    } catch (e) {
      return { hour: "12", minute: "00", period: "AM" };
    }
  };

  const { hour, minute, period } = get12HourValues();
  const [currentHour, setCurrentHour] = React.useState(hour);
  const [currentMinute, setCurrentMinute] = React.useState(minute);
  const [currentPeriod, setCurrentPeriod] = React.useState(period);

  // Update time when values change
  React.useEffect(() => {
    if (time) {
      const { hour, minute, period } = get12HourValues();
      setCurrentHour(hour);
      setCurrentMinute(minute);
      setCurrentPeriod(period);
    }
  }, [time]);

  // Apply time changes
  const applyTimeChanges = (hour: string, minute: string, period: string) => {
    let hour24 = parseInt(hour, 10);
    
    // Convert 12-hour to 24-hour
    if (period === 'PM' && hour24 < 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    setTime(`${hour24.toString().padStart(2, '0')}:${minute}`);
  };

  // Handle hour change
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    
    val = Math.max(1, Math.min(12, val));
    const newHour = val.toString().padStart(2, '0');
    setCurrentHour(newHour);
    applyTimeChanges(newHour, currentMinute, currentPeriod);
  };

  // Handle minute change
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    
    val = Math.max(0, Math.min(59, val));
    const newMinute = val.toString().padStart(2, '0');
    setCurrentMinute(newMinute);
    applyTimeChanges(currentHour, newMinute, currentPeriod);
  };

  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    setCurrentPeriod(newPeriod);
    applyTimeChanges(currentHour, currentMinute, newPeriod);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !time && "text-gray-500",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {time ? formatTimeForDisplay(time) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-6" align="start">
        <div className="flex flex-col items-center space-y-6">
          {/* Digital Time Display */}
          <div className="text-center">
            <div className="text-4xl font-semibold tracking-wider">
              {parseInt(currentHour)}:{currentMinute.padStart(2, '0')} {currentPeriod}
            </div>
            <div className="text-xs text-gray-500 mt-2">Select time</div>
          </div>

          {/* Time Input Controls */}
          <div className="flex items-center space-x-4 w-full">
            <div className="flex-1">
              <Label htmlFor="hours" className="text-xs block text-center mb-1.5">Hour</Label>
              <Input
                id="hours"
                type="number"
                min={1}
                max={12}
                value={currentHour}
                onChange={handleHourChange}
                className="h-12 text-center text-lg font-medium"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="minutes" className="text-xs block text-center mb-1.5">Minute</Label>
              <Input
                id="minutes"
                type="number"
                min={0}
                max={59}
                value={currentMinute}
                onChange={handleMinuteChange}
                className="h-12 text-center text-lg font-medium"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs block text-center mb-1.5">Period</Label>
              <div className="flex h-12">
                <Button
                  type="button"
                  variant={currentPeriod === 'AM' ? 'default' : 'outline'}
                  onClick={() => handlePeriodChange('AM')}
                  className="rounded-r-none flex-1 px-0 text-lg font-medium"
                >
                  AM
                </Button>
                <Button
                  type="button"
                  variant={currentPeriod === 'PM' ? 'default' : 'outline'}
                  onClick={() => handlePeriodChange('PM')}
                  className="rounded-l-none flex-1 px-0 text-lg font-medium"
                >
                  PM
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 