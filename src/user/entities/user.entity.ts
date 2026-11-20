import { Task } from 'src/task/entities/task.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn({ type: "int" })
    id: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({
        type: 'varchar',
        length: 50,
        unique: true,
    })
    username: string;

    @Column({ type: 'varchar' })
    password: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Task, (task) => task.user)
    tasks: Task[];

}