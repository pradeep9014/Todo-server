import { User } from 'src/user/entities/user.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';


export enum TaskStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'inprogress',
    COMPLETED = 'completed',
}

export enum TaskPriority {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
}

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn({ type: "int" })
    id: string;

    @Column({ type: 'varchar', length: 150 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.PENDING,
    })
    status: TaskStatus;

    @Column({
        type: 'enum',
        enum: TaskPriority,
        default: TaskPriority.MEDIUM,
    })
    priority: TaskPriority;


    @ManyToOne(() => User, (user) => user.tasks)
    @JoinColumn({ name: 'userId' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}