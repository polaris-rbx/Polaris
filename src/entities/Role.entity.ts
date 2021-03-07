// Used to represent a group, which is part of server settings.
import {
  Column,
  Entity,
  PrimaryColumn
} from "typeorm";

/**
 * Represents a Discord role, in a given Discord server.
 * It can be exempted from Polaris, made a moderator - or bound.
 */
// needs some kind of association with server directly so we can erase it if needs be?
@Entity("Role")
export default class RoleEntity {
  @PrimaryColumn({ length: 25 })
  id: string;

  // If true this role is exempt from all Polaris management effects
  @Column({
    nullable: false,
    default: false
  })
  exempt: boolean;

  @Column({
    nullable: false,
    default: false
  })
  isMod: boolean;
}
