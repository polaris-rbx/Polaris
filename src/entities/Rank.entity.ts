// Used to represent a group, which is part of server settings.
import {
  Column,
  Entity, ManyToOne,
  PrimaryColumn
} from "typeorm";

import Group from "./Group.entity";
import ServerEntity from "./Server.entity";

/**
 * Represents a Discord role, in a given Discord server.
 * It can be exempted from Polaris, made a moderator - or bound.
 */
// needs some kind of association with server directly so we can erase it if needs be?
@Entity("Role")
export default class RankEntity {
  // The roleset id
  @PrimaryColumn()
  id: number;

  // Primary as a RankEntity is only unique per Server - Multiple servers can bind the same Rank with different aliases.
  @ManyToOne(() => ServerEntity, {
    primary: true,
    onDelete: "CASCADE"
  })
  group: Group;

  // For nickname management
  @Column({ nullable: true })
  alias: String;
}
