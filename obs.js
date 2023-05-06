// obs: browser-source helper
// (c)copyright 2021 by Gerald Wodni <gerald.wodni@gmail.com>

const { marked } = require("marked");
const moment = require("moment");

module.exports = {
    setup: function( k ) {

        function renderProgram( req, res, next, opts ) {
            k.rdb.get( `${req.kern.website}:active-presentation`, async (err, activePresentationId) => {
                if( err )
                    activePresentationId = 0;
                const days = req.getman.uint("dayOffset") || 0;
                const sessions = await k.setupOpts.sessionPresentations( req );
                const rootDaySessions = sessions.filter( s => moment(s.date).format( "YYYY-MM-DD" ) == moment( new Date() ).add(days, 'days').format( "YYYY-MM-DD") && s.onAir );
                const daySessions = [];
                for( let daySession of rootDaySessions )
                    while( daySession ) {
                        if( daySessions.indexOf( daySession ) == -1 )
                            daySessions.push( daySession );
                        daySession = daySession.nextSession;
                    }

                k.jade.render( req, res, "obs/program", Object.assign( { sessions: daySessions, activePresentationId }, opts ) );
            });
        }
        k.router.get("/program",            async (req, res, next) => renderProgram( req, res, next, { showAvatar: false } ) );
        k.router.get("/program-tomorrow",   async (req, res, next) => renderProgram( req, res, next, { showAvatar: false } ) );
        k.router.get("/program-me",         async (req, res, next) => renderProgram( req, res, next, { showAvatar: true  } ) );

        async function renderMe( req, res, next, opts ) {
            const me = (await req.kern.db.pQuery( "SELECT name, presentationTitle FROM guests WHERE id=1" ) )[0];
            k.jade.render( req, res, "obs/border", Object.assign( { author: me.name, presentation: me.presentationTitle }, opts ) );
        }
        k.router.get("/left-me", async (req, res, next) => renderMe( req, res, next, { showAvatar: true } ) );

        k.router.get("/me", async (req, res, next) => renderMe( req, res, next, { showAvatar: false, hideBottomText: true } ) );

        k.router.get("/border", (req, res, next) => {
            const opts = {};
            if( req.getman.exists("hideBottomText") )
                opts.hideBottomText = true;

            k.rdb.get( `${req.kern.website}:active-presentation`, (err, id) => {
                if( err )
                    id = "0";

                req.kern.db.pQuery( `
                    SELECT
                        presentations.title AS presentation,
                        guests.name AS author
                    FROM presentations
                    LEFT JOIN guests
                    ON guests.id=presentations.guest
                    WHERE presentations.id=?
                `, [ id ])
                .then( data => k.jade.render( req, res, "obs/border",  Object.assign({showAvatar: true}, data[0], opts) ) );
            });

        });

        k.router.get("/", (req, res, next) => {
            k.readHierarchyFile( k.website, "views/obs/ReadMe.md", function( err, data ) {
                if( err )
                    return next( err );

                const markdown = marked( data.toString() );
                k.jade.render( req, res, "obs/obs", { markdown });
            });
        });
    }
};
