import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum Status {
    Created = 'created',
    Processing = 'processing',
    Completed = 'completed',
    Failed = 'failed'
}

@Entity()
export class Session {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ default: Status.Created })
    status: string

    @CreateDateColumn()
    createDate: Date

    @Column({ type: String, nullable: true })
    verifier?: string

    @Column({ type: String, length: 4096, nullable: true })
    accessToken?: string

    @Column({ type: String, length: 1024, nullable: true })
    refreshToken?: string

    @Column({ type: Date, nullable: true })
    tokenExpiryDate?: Date
}
