import {Entity, Column, PrimaryGeneratedColumn, BaseEntity, BeforeInsert, BeforeUpdate} from 'typeorm'
import * as bcrypt from 'bcrypt'

const SALT_FACTOR = 8

@Entity()
export default class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    length: 16,
    unique: true,
    collation: 'NOCASE',
    charset: 'utf8',
    nullable: false
  })
  username!: string

  @Column({
    length: 16,
    nullable: false
  })
  password!: string

  @Column()
  admin: boolean = false

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword () {
    const salt = await bcrypt.genSalt(SALT_FACTOR)
    const hash = await bcrypt.hash(this.password, salt)
    this.password = hash
  }
}
