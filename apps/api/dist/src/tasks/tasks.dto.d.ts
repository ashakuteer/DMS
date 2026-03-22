import { TaskType, TaskStatus, TaskPriority } from '@prisma/client';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    type: TaskType;
    priority?: TaskPriority;
    dueDate: string;
    donorId?: string;
    beneficiaryId?: string;
    assignedTo?: string;
}
export declare class UpdateTaskStatusDto {
    status: TaskStatus;
}
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    type?: TaskType;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: string;
    assignedTo?: string | null;
}
