// Used to represent a group, which is part of server settings.
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn
} from "typeorm";

import Group from "./Group.entity";

@Entity("Server")
export default class ServerEntity {
  @PrimaryColumn({ type: "text" })
  id: string;

  @Column({ default: false })
  autoVerify: boolean;

  @Column({
    nullable: true,
    length: 50
  })
  nicknameTemplate: string;

  @Column({
    nullable: true,
    length: 2
  })
  prefix: string;

  @OneToMany(() => Group, group => group.server, { onDelete: "CASCADE" })
  groups: Group[];
}
