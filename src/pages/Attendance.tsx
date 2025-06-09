import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { CalendarClock, ClipboardList } from "lucide-react";
import { AttendanceSummary } from "../components/attendance/AttendanceSummary";
import { CheckInButton } from "../components/attendance/CheckInButton";
import { AttendanceHistory } from "../components/attendance/AttendanceHistory";
import { AttendanceProvider } from "../context/AttendanceContext";
import { Card, CardContent } from "../components/ui/card";
import { MainLayout } from "../components/Layout/MainLayout";

const Attendance: React.FC = () => {
  const [activeTab, setActiveTab] = useState("today");

  return (
    <MainLayout>
      <AttendanceProvider>
        <div className="container px-4 py-6 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarClock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Attendance</h1>
              <p className="text-sm text-muted-foreground">
                Track your gym check-ins and attendance streak
              </p>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Summary and Check-in section */}
            <div className="space-y-4 md:col-span-1">
              <AttendanceSummary />
              
              <Card>
                <CardContent className="pt-6">
                  <CheckInButton />
                </CardContent>
              </Card>
            </div>
            
            {/* History section */}
            <div className="md:col-span-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="today">
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Today
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    History
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="today" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="mb-4 rounded-full bg-primary/10 p-3">
                          <CalendarClock className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="mb-2 text-2xl font-bold">Daily Check-In</h3>
                        <p className="mb-6 text-muted-foreground max-w-md">
                          Track your fitness journey by checking in every day. 
                          Build a streak and stay consistent with your fitness goals!
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="history" className="mt-4">
                  <AttendanceHistory />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </AttendanceProvider>
    </MainLayout>
  );
};

export default Attendance; 