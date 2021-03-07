# Polaris v4
This branch represents the start of work on Polaris v4.
This is now a collaborative project - please feel to contribute! 
Only target is to ship sometime this year.


## What its going to use
- Aquarius for verification (to be renamed)
- Typescript
- PostgreSQL with an ORM

- Node-fetch

Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

# note: This readme currently represents random notes. It will be updated at a later date.

### Web panel
There are no plans to re-do the web panel, though it's database will likely need updated to whatever Polaris uses.

## Replace rank with roleset? When is roleset updated?


## Note-able changes
- IPC is no longer required. The web panel interacts directly with Discord over REST.
- mainGroup is no longer supported: A collection of groups is sufficient
- Now use typescript
- Now uses Typeorm (and PostgreSQL)
- GuildSettings.binds is no longer supported: These should be imported into the applicable group.

## Issues
### Nickname management
Removing main group causes issues for this.
#### Possible solutions:
##### More complex/granular nickname system
Could still be a string formatted but with groupRank:Groupid etc.
Or could be something stored in a more complex way - 
People want to be able to make short text.

Why not: Combination of string + Group.rankAliases?

##### Have a value/boolean that determines *which* group its on
##### Put a nicknameTemplate on each Group entity.
