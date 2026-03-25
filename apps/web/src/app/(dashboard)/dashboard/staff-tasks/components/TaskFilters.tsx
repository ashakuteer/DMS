"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface StaffUser {
  id: string;
  name: string;
  role: string;
}

interface TaskFiltersProps {
  status: string;
  setStatus: (v: string) => void;
  taskType: string;
  setTaskType: (v: string) => void;
  timeRange: string;
  setTimeRange: (v: string) => void;
  staffId: string;
  setStaffId: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  staffList: StaffUser[];
}

export default function TaskFilters({
  status,
  setStatus,
  taskType,
  setTaskType,
  timeRange,
  setTimeRange,
  staffId,
  setStaffId,
  search,
  setSearch,
  staffList,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
          data-testid="input-task-search"
        />
      </div>

      {/* Staff member filter */}
      <Select value={staffId} onValueChange={setStaffId}>
        <SelectTrigger className="w-[175px]" data-testid="select-staff-filter">
          <SelectValue placeholder="All Staff" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Staff</SelectItem>
          {staffList.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Task type filter */}
      <Select value={taskType} onValueChange={setTaskType}>
        <SelectTrigger className="w-[155px]" data-testid="select-task-type">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Types</SelectItem>
          <SelectItem value="RECURRING_INSTANCE">Recurring</SelectItem>
          <SelectItem value="STAFF">One-time</SelectItem>
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[155px]" data-testid="select-task-status">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="OVERDUE">Overdue</SelectItem>
          <SelectItem value="MISSED">Missed</SelectItem>
        </SelectContent>
      </Select>

      {/* Time filter */}
      <Select value={timeRange} onValueChange={setTimeRange}>
        <SelectTrigger className="w-[145px]" data-testid="select-time-range">
          <SelectValue placeholder="All Time" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Time</SelectItem>
          <SelectItem value="TODAY">Today</SelectItem>
          <SelectItem value="WEEK">This Week</SelectItem>
          <SelectItem value="MONTH">This Month</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
