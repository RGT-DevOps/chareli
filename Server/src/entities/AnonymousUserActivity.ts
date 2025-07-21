import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from './Games';
import { User } from './User';

@Entity('anonymous_user_activity')
@Index(['sessionId', 'gameId'])
@Index(['sessionId', 'createdAt'])
@Index(['convertedUserId', 'createdAt'])
@Index(['userState', 'createdAt'])
@Index(['deviceType', 'country'])
export class AnonymousUserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  sessionId: string;

  @Column()
  @Index()
  gameId: string;

  @ManyToOne(() => Game, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Column({ type: 'timestamp' })
  @Index()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number;

  @Column({ type: 'int' })
  freeTimeLimitSeconds: number;

  @Column({ default: false })
  @Index()
  reachedTimeLimit: boolean;

  @Column({ nullable: true })
  @Index()
  deviceType: string;

  @Column({ nullable: true })
  @Index()
  country: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  @Index()
  convertedUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'convertedUserId' })
  convertedUser: User;

  @Column({ default: false })
  @Index()
  isVerified: boolean;

  @Column({ default: 'anonymous' })
  @Index()
  userState: string; // 'anonymous', 'registered_not_logged_in', 'logged_in'

  @Column({ type: 'timestamp', nullable: true })
  convertedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
