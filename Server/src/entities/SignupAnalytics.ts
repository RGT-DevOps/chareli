import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from './Games';
import { User } from './User';

@Entity('signup_analytics')
export class SignupAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  sessionId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  @Index()
  country: string;

  @Column({ nullable: true })
  @Index()
  deviceType: string; 

  @Column()
  @Index()
  type: string; 

  @Column({ nullable: true })
  @Index()
  gameId: string;  // Which game they were playing when they clicked signup

  @ManyToOne(() => Game, { nullable: true })
  @JoinColumn({ name: 'gameId' })
  game: Game;

  @Column({ nullable: true })
  @Index()
  userId: string;  // Set when user completes registration

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: false })
  convertedToAccount: boolean;  // Whether this signup click led to account creation

  @Column({ default: false })
  userVerified: boolean;  // Whether user completed first login

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
