// Used to represent a group, which is part of server settings.
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn
} from "typeorm";

import Group from "./Group.entity";
import RankEntity from "./Rank.entity";
import RoleEntity from "./Role.entity";

@Entity("Bind")
export default class BindEntity {
  @ManyToOne(() => Group, grp => grp.binds, {
    primary: true,
    onDelete: "CASCADE"
  })
  group: Group;

  @ManyToOne(() => RoleEntity, {
    primary: true,
    eager: true,
    nullable: false
  })
  role: RoleEntity;

  @ManyToOne(() => RankEntity, {
    primary: true,
    eager: true,
    nullable: false
  })
  rank: RankEntity;

  // Todo: Should this be removed? renamed? Feel like it doesn't really fit with the "roleset" theme
  // could be isMinimum?
  @Column({
    nullable: false,
    default: true
  })
  exclusive: boolean;
}
