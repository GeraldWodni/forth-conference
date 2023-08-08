// my EuroForth section: allow attendees to edit their own details
// (c)copyright 2021 by Gerald Wodni <gerald.wodni@gmail.com>

const md5 = require("md5");
const util = require("util");
const BbbApi = require("bbb-rooms");

const bbbHost = process.env.BBB_HOST;
const bbbApi = new BbbApi( bbbHost, process.env.BBB_SECRET );

module.exports = {
    setup: function( k ) {
        const prices = k.setupOpts.prices;
        const rooms = prices.bbbRooms || {};

        function vals( req, values ) {
            return Object.assign( {
                conferenceName: prices.conference,
                year: prices.year,
                prices,
                guest: req.guest,
                rooms,
            }, values );
        }

        k.router.all("/:hash*", (req, res, next) => {
            const hash = req.requestman.id("hash");
            req.kern.db.query("SELECT * FROM guests WHERE editHash={hash}", { hash }, (err, data) => {
                if( err )
                    return next( err );

                if( data.length != 1 )
                    return k.httpStatus( req, res, 403 );

                req.guest = data[0];
                next();
            });
        });

        /* join rooms */
        k.router.get("/:hash/join-room/:id", async ( req, res, next ) => {
            var id = req.requestman.id("id");
            if( !rooms.hasOwnProperty( id ) )
                return k.httpStatus( req, res, 404 );

            /* allow room override (i.e. for chairs) */
            const room = rooms[ id ];
            if( room.roomId )
                id = room.roomId;

            const isConference = room.type == "conference";

            const avatarURL = `https://${process.env.GRAVATAR_PROXY_HOST}/proxy/gravatar/${md5(req.guest.email)}/48/retro`;
            
            const joinOpts = {
                meetingID: id,
                fullName: req.guest.name,
                password: room.rights,
                redirect: true,
                avatarURL,
                "userdata-bbb_auto_join_audio": true,
                "userdata-bbb_client_title": `${room.name} - EuroForth`,
                "userdata-bbb_show_public_chat_on_login": false,
                "userdata-bbb_hide_presentation": !isConference,
                //"userdata-bbb_force_restore_presentation_on_new_events": isConference,
                "userdata-bbb_custom_style": `body{background-image:url(https://${bbbHost}/images/${id}.jpg);background-repeat:no-repeat;}`,
                //"userdata-bbb_auto_swap_layout": true,
                "userdata-avatarURL": avatarURL,
            }
            const createOpts = {
                name: room.name,
                meetingID: id,
                attendeePW: "attendee",
                moderatorPW: "moderator",
                logoutURL: `https://${k.website}`,
            };

            if( room.hasOwnProperty( "layout" ) )
                createOpts.meetingLayout = room.layout

            //return res.json( { joinOpts, createOpts });
            const slides =  [];
            if( room.layout == "PRESENTATION_FOCUS" )
                slides.push( { url: `https://${bbbHost}/images/presentation.jpg`, filename: "welcome.jpg" } );

            try {
                const bbbRes = await bbbApi.joinPersitantRoomUrl( joinOpts, createOpts, slides );
                console.log( "JOIN URL:".bold.yello, bbbRes, "\n", util.inspect( { joinOpts, createOpts }, false, null, true ) );
                res.redirect( bbbRes.join );
            }
            catch( err ) {
                next( err );
            }
        });

        /* edit and show details */
        async function renderMain( req, res, next, values ) {
            const attendees = {};
            try {
                const meetings = (await bbbApi.getMeetings()).meetings;
                for( const meeting of meetings )
                    attendees[ meeting.meetingID ] = meeting.attendees.map( a => { return {
                        name: a.fullName,
                        avatarUrl: a.customdata.avatarURL,
                    } });
                console.log( "MEETINGS:", util.inspect( attendees, false, null, true ) );
            } catch( err ) {
                switch( err.code ) {
                    case 'ENOTFOUND':
                        break;
                    default:
                        return next( err );
                }
            }
            k.jade.render( req, res, "myConference", vals( req, Object.assign({ attendees }, values) ) );
        }

        k.router.postman("/:hash", (req, res, next) => {
            const values = {
                presentationTitle: req.postman.text( "presentationTitle" ),
                presentationDescription: req.postman.text( "presentationDescription" ),
                presentationLength: req.postman.text( "presentationLength" )
            };
            req.kern.db.query( "UPDATE guests SET ? WHERE id=?", [ values, req.guest.id ], ( err, data ) => {
                if( err ) return next( err );

                const messages = [{ type: "success", title: "Success", text: "Presentation updated" }];
                renderMain( req, res, next, { messages, showForm: false } );
            });
        });
        k.router.get("/:hash", (req, res, next) => {
            renderMain( req, res, next, { messages: [], showForm: true } );
        });
    }
};
