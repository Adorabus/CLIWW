import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    length: 16
  })
  name!: string

  @Column()
  admin!: boolean
}
