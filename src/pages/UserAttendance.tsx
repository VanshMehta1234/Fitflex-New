import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CalendarCheck, RefreshCw, Search, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, startOfDay, isEqual } from "date-fns";
import toast from "react-hot-toast";
import { MainLayout } from "../components/Layout/MainLayout";
// Types for our data
interface User {
  id: string;
  name?: string;
  email?: string;
  role: string;
  created_at: string;
}

interface Attendance {
  id: string;
  user_id: string;
  check_in_time: string;
  notes?: string;
  created_at: string;
}

interface UserWithAttendance extends User {
  attendances: Attendance[];
  email?: string;
}

const UserAttendance: React.FC = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithAttendance[]>([]);
  // filteredUsers will be memoized later
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedUser, setSelectedUser] = useState<UserWithAttendance | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Selected month for calendar
  const [month, setMonth] = useState<Date>(new Date());

  // Calendar days in current month
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month)
  });

  // Ensure admin access
  useEffect(() => {
    if (!user) {
      return;
    }

    if (userRole !== 'admin') {
      toast.error("Access denied: Admin privileges required");
      navigate('/home');
    }
  }, [user, userRole, navigate]);

  // Apply search filter
  // No longer need filterUsers() function or its useEffect, will use useMemo for filteredUsers

  const loadUsersData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (usersError) throw usersError;

      if (!usersData || usersData.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const firstDay = startOfMonth(month);
      const lastDay = endOfMonth(month);

      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .gte('check_in_time', firstDay.toISOString())
        .lte('check_in_time', lastDay.toISOString());

      if (attendanceError) throw attendanceError;

      const usersWithAttendance: UserWithAttendance[] = usersData.map((userData: User) => ({
        ...userData,
        attendances: attendanceData?.filter(a => a.user_id === userData.id) || []
      }));

      setUsers(usersWithAttendance);

    } catch (error) {
      console.error("Error loading users data:", error);
      toast.error("Failed to load users data");
      setUsers([]); // Clear users on error
    } finally {
      setLoading(false);
    }
  }, [month]); // month is a dependency here

  // Ensure user is admin - moved this up to group useEffects
  // useEffect(() => {
  //   if (!user) {
  //     return;
  //   }
  //   if (userRole !== 'admin') {
  //     toast.error("Access denied: Admin privileges required");
  //     navigate('/home');
  //   }
  // }, [user, userRole, navigate]);

  // Load users and attendance data - moved this up
  // useEffect(() => {
  //   if (userRole === 'admin') {
  //     loadUsersData();
  //   }
  // }, [userRole, loadUsersData]); // loadUsersData is now a dependency
  useEffect(() => {
    if (user && userRole === 'admin') {
      loadUsersData();
    }
  }, [user, userRole, loadUsersData]);
  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        (u.name?.toLowerCase().includes(query)) ||
        (u.email?.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [users, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsersData(); // loadUsersData is already memoized
    setRefreshing(false);
    toast.success("Attendance data refreshed");
  }, [loadUsersData]); // loadUsersData is a dependency

  // Helper to get attendance for a specific day and user
  const getAttendanceForDay = (userId: string, date: Date) => {
    const user = users.find(u => u.id === userId);
    if (!user) return [];

    const targetDate = startOfDay(date);

    return user.attendances.filter(attendance => {
      const attendanceDate = startOfDay(new Date(attendance.check_in_time));
      return isEqual(attendanceDate, targetDate);
    });
  };

  const UserCalendar = ({ userId }: { userId: string }) => {
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    return (
      <div className="p-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{user.name || user.email}'s Attendance</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Previous Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonth(new Date())}
            >
              Current Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            >
              Next Month
            </Button>
          </div>
        </div>

        <div className="text-center mb-2">
          <h4 className="text-lg font-medium">
            {format(month, 'MMMM yyyy')}
          </h4>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            // Get attendance for this day
            const dayAttendances = getAttendanceForDay(userId, day);
            const hasAttendance = dayAttendances.length > 0;

            return (
              <div
                key={day.toString()}
                className={`
                  p-2 border rounded-md text-center h-12 flex items-center justify-center
                  ${!isSameMonth(day, month) ? 'text-gray-300 bg-gray-50 dark:bg-gray-800/20 dark:text-gray-600' : ''}
                  ${isToday(day) ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'}
                  ${hasAttendance ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
                  cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50
                `}
                onClick={() => setSelectedDate(day)}
              >
                <div>
                  <div className={`text-sm ${isToday(day) ? 'font-bold' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  {hasAttendance && (
                    <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Attendance details for selected date */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">
            {format(selectedDate, 'MMMM d, yyyy')}
          </h3>

          {getAttendanceForDay(userId, selectedDate).length > 0 ? (
            <div className="space-y-3">
              {getAttendanceForDay(userId, selectedDate).map((attendance) => (
                <Card key={attendance.id} className="p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-500">
                        Check-in: {format(new Date(attendance.check_in_time), 'h:mm a')}
                      </div>
                      {attendance.notes && (
                        <div className="text-sm mt-1">
                          Note: {attendance.notes}
                        </div>
                      )}
                    </div>
                    <CalendarCheck className="text-green-500 h-5 w-5" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No attendance records for this date
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container px-4 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CalendarCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">User Attendance</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage attendance records for all members
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <MemoizedUserList
              filteredUsers={filteredUsers}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              handleRefresh={handleRefresh}
              refreshing={refreshing}
              days={days} // days is already memoized by being outside or from useMemo if month changes
            />
          </div>

          <div className="lg:col-span-3">
            {selectedUser ? (
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Calendar</CardTitle>
                  <CardDescription>Monthly attendance record</CardDescription>
                </CardHeader>
                <CardContent>
                  <UserCalendar userId={selectedUser.id} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center min-h-[500px] text-center">
                  <div className="max-w-md">
                    <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">Select a User</h3>
                    <p className="text-muted-foreground">
                      Select a user from the list to view their detailed attendance records and calendar.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

// Define Props interface for UserList
interface UserListProps {
  filteredUsers: UserWithAttendance[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedUser: UserWithAttendance | null;
  setSelectedUser: (user: UserWithAttendance | null) => void;
  handleRefresh: () => void;
  refreshing: boolean;
  days: Date[];
}

// Define UserList component
const UserListComponent: React.FC<UserListProps> = ({
  filteredUsers,
  loading,
  searchQuery,
  setSearchQuery,
  selectedUser,
  setSelectedUser,
  handleRefresh,
  refreshing,
  days,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Attendance Records</CardTitle>
        <CardDescription>
          View and manage attendance for all members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search users..."
              className="pl-8 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center p-4 border rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => {
                // Ensure days array is not empty to avoid division by zero
                const attendanceCount = user.attendances.length;
                const attendancePercentage = days.length > 0 ? Math.round((attendanceCount / days.length) * 100) : 0;

                return (
                  <div
                    key={user.id}
                    className={`
                      flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                      ${selectedUser?.id === user.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                    `}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                      <CalendarCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{user.name || 'Unnamed User'}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{attendanceCount} days</div>
                      <div className="text-sm text-muted-foreground">{attendancePercentage}% this month</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No users found matching your search
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Wrap UserListComponent with React.memo
const MemoizedUserList = React.memo(UserListComponent);

export default UserAttendance;