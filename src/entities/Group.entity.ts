// Used to represent a group, which is part of server settings.
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn
} from "typeorm";

import Bind from "./Bind";
import Server from "./Server.entity";

@Entity("Group")
export default class GroupEntity {
  // Roblox Group id
  @PrimaryColumn()
  id: number;

  // Primary as multiple servers can add multiple groups.
  @ManyToOne(() => Server, server => server.groups, {
    primary: true,
    onDelete: "CASCADE"
  })
  server: Server;

  @Column({ default: false })
  ranksToRoles: boolean;

  @OneToMany(() => Bind, bind => bind.group, {
    onDelete: "CASCADE",
    eager: true
  })
  binds: Bind[];
}
