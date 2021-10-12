# Forth Conference System

Public facing features:
- Configuration for multiple hotels with multiple modes each
- Self-Registration with hotel and presentation(s)
- Immediate email with edit link to manage presentations

Accessible via link:
- Multi-year-archive
- List of attendees

Administrative features (available to organizers)
- Session management and presentation assignment
- Nice looking schedule reports - i.e. for use as OBS browser source
- Nice looking Frames with current speaker - again intended as OBS browser source

## Build
This system builds upon [kern.js](https://github.com/geraldwodni/kern.js) create the [big Dockerfile](https://github.com/GeraldWodni/kern.js/blob/master/docker/big) and then run this dockerfile on top of it.

To manage your database backups automatically and have the db setup properly also buld the [database-sync Dockerfile](https://github.com/GeraldWodni/kern.js/tree/master/docker/database-sync).

Last build the [website-sync Dockerfile](https://github.com/GeraldWodni/kern.js/tree/master/docker/website-sync) which will sync your own conference repo with all the configuraion.

## Install
1. See the documentation above about which environment variables need to be set.
2. Setup a _private_ repository for your database and put the empty [database](https://github.com/GeraldWodni/forth-conference/blob/master/sql/conference.sql) export into it, or use [create-database-repo.sh](https://github.com/GeraldWodni/forth-conference/blob/master/sql/create-database-repo.sh).
3. Configure database-sync to use said repository.
4. Setup another _public or private_ repository for your conference configuration. Make sure not to leak any confidential information.
5. Keep all login and confidential information in environment variables and in none of the above repos.

I use kubernetes to host the containers, so I cannot present a docker-compose file. Feel free to submit one via pull request. If I remember, I will put a working kubernetes configuration for an existing conference here. As I am dividing the old monolithic conference system as I type this there is no working configuration yet.

## Configuration

### config.json
You can put permanent non critical information here, most likely you will not change anything and use the environment variables desribed below instead.

### Environment variables
- `PRESENTATION_DEFAULT_LENGTH`: default presentation length in minutes, (default: `45`)

#### Registration email:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_EMAIL`: `from`-field for registration email (most likely same as `SMTP_USER` on modern email services)
- `SMTP_PASSWORD`

### Gravatar:
- `GRAVATAR_PROXY_HOST`: to protect users privacy gravatars are proxied over this host. See [forth-standard.org](https://github.com/GeraldWodni/forth-standard.org) for an example on how to use that.

### Files
kern.js uses a hierarchical file lookup: this means you can override every file in your local website by simply naming it the same and keeping the relative path.

#### LaTeX templates
Example templates are provided for creating a confirmation and an invoice PDF. Copy them to your own website folder and adopt them if you want to make use of the integrated LaTeX system.

### Users
To access your instance you can provide a users.json file (only in _private_ repositories!) or generate one using [cli.js](https://github.com/GeraldWodni/kern.js/blob/master/cli.js) inside your running container.
