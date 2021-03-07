# Contributing
Polaris has, largely, been mainly developed by Neztore for the last few years. 
It's evident that I don't have the time it really needs - so we're putting more of a focus on community collaboration.

All PRs and issues are welcome. Do not commit directly to master.

For PRs please ensure:
- Linting passes
- You have tested the feature extensively
- Your code is commented and well formatted

## Setting up for local development
### Prerequisites
- Install Nodejs > v12
- Install PostgreSQL
- (Recommended) get a DB management software like DBeaver or pgAdmin


### Installing
> Note: You'll probably want to fork, and clone your fork so you can PR changes
1. Clone the repository `git clone --branch v4 https://github.com/polaris-rbx/polaris`
2. Run `npm install` in the repository directory
3. Set up env

### Setting up env
1. Copy the `.env.template` file and rename to `.env`
2. Put valid files in the .env file.

### Setting up the database
The file `ddl.sql` contains the setup commands for the database. You should run these to create the nessessary tables.
note: might support auto creation at some point.
