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
2. Setup a _private_ repository for your database and put the empty database(TODO:link) export into it.
3. Configure database-sync to use said repository.
4. Setup another _public or private_ repository for your conference configuration. Make sure not to leak any confidential information.
5. Keep all login and confidential information in environment variables and in none of the above repos.

I use kubernetes to host the containers, so I cannot present a docker-compose file. Feel free to submit one via pull request. If I remember, I will put a working kubernetes configuration for an existing conference here. As I am dividing the old monolithic conference system as I type this there is no working configuration yet.

