import {Entity, Column, PrimaryGeneratedColumn, BaseEntity} from 'typeorm'

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    length: 16,
    unique: true,
    collation: 'NOCASE',
    charset: 'utf8'
  })
  username!: string

  @Column()
  admin: boolean = false
}
