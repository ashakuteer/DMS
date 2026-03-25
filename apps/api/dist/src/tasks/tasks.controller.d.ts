import { TasksService } from './tasks.service';
import { TaskSchedulerService } from './task-scheduler.service';
import { CreateTaskDto, UpdateTaskStatusDto, UpdateTaskDto } from './tasks.dto';
export declare class TasksController {
    private tasksService;
    private taskSchedulerService;
    constructor(tasksService: TasksService, taskSchedulerService: TaskSchedulerService);
    triggerGeneration(): Promise<{
        message: string;
    }>;
    create(dto: CreateTaskDto): Promise<any>;
    getToday(): Promise<{
        dueToday: any;
        overdue: any;
        total: any;
    }>;
    getStaffList(): Promise<any>;
    findAll(status: string, type: string, category: string, dueDate: string, assignedTo: string, priority: string): Promise<any>;
    findOne(id: string): Promise<any>;
    completeTask(id: string): Promise<any>;
    updateStatus(id: string, dto: UpdateTaskStatusDto): Promise<any>;
    updateTask(id: string, dto: UpdateTaskDto): Promise<any>;
    deleteTask(id: string): Promise<any>;
}
