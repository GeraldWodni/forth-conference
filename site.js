// theforth.net main include file, needs kern.js, see https://github.com/GeraldWodni/kern.js
// (c)copyright 2014-2015 by Gerald Wodni <gerald.wodni@gmail.com>
"use strict";

const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const { marked } = require("marked");
const crypto = require("crypto");
const moment = require("moment");

module.exports = {
    setup: function( k ) {

	k.prefixServeStatic( "/files/" );

        const viewYearPrefix =  'views/' + k.getWebsiteConfig( "year" );

        var emailTransport = nodemailer.createTransport( smtpTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            tls: {
                rejectUnauthorized: false
            },
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            }
        }));

        const pricesPath = k.hierarchy.lookupFile( k.website, `./${viewYearPrefix}/prices.js`);
        var prices = require( `../../${pricesPath}` );
        function updateDates() {
            prices.meeting.programActive = new Date() > new Date( prices.meeting.start || "2000-01-01" );
            prices.meeting.registrationActive = new Date() > new Date( prices.meeting.openRegistration || "2000-01-01" );
        }
        updateDates();

        /* global value function (place generic value logic here) */
        function vals( req, obj ) {
            return Object.assign({
                conferenceName: prices.conference + " " + prices.year,
                showPresentationList: prices.showPresentationList || false,
            }, obj);
        }

        k.reg("admin").addSiteModule( "guests", k.website, "guests.js", "Guests", "home", {
            setup: {
                prices: prices
            }
        });
        k.reg("admin").addSiteModule( "presentations", k.website, "presentations.js", "Presentations", "play-circle" );
        k.reg("admin").addSiteModule( "sessions",      k.website, "sessions.js",      "Sessions",      "time" );

        function formatNumber( num, size ) {
            var s = "      " + num.toFixed( 2 );
            return s.substr( s.length - size ).replace( /\./, ',' );
        }

        function randomHash() {
            return new Promise( (fulfill, reject ) => {
                crypto.randomBytes(256, function( err, buffer) {
                    if( err )
                        return reject( err );

                    var hash = crypto.createHmac( "md5", "DylkyewyensOgOageidlojhyitastyoi" );
                    hash.update( buffer );
                    fulfill( hash.digest( "hex" ) );
                });
            });
        }

        /* editHash for guests: let them edit their details */
        /* guard and load guest */
        k.useSiteModule( `/${prices.myName}`, k.website, "my.js", { setup: { prices } } );


        /* main website */
        k.router.post( ["/", "/preview"], function( req, res, next ) {
            updateDates();
            var messages = [];

            randomHash().then( editHash => {
                k.postman( req, res, function() {

                    var extraDays = req.postman.array( "email", "extraDays" );

                    /* TODO: could use CRUD-presenter's readFields instead */
                    var values = {
                        hotel: req.postman.text( "hotel" ),
                        name: req.postman.address( "name" ),
                        address: req.postman.address(),
                        telephone: req.postman.telephone(),
                        email: req.postman.email(),
                        memberNumber: req.postman.id("memberNumber"),
                        remark: req.postman.text( "remark" ),
                        //partner: req.postman.text( "partner" ),
                        partner: req.postman.exists( "partnerTour" ) ? "Partnertour-YES" : "Partnertour-NO",
                        partnerName: req.postman.address( "partnerName" ),
                        partnerAddress: req.postman.address( "partnerAddress" ),
                        editHash,
                        presentationTitle: req.postman.text( "presentationTitle" ),
                        presentationDescription: req.postman.text( "presentationDescription" ),
                        presentationLength: req.postman.text( "presentationLength" ),
                        extraDays: extraDays.join( ", " ),
                        helping: '',
                        //helping: req.postman.text( "helping" )
                        //helping: "Mitfahrgelegenheit: " + req.postman.text( "drivingCount" ) + " von " + req.postman.text("drivingLocation")
                    };

                    var noSpam = req.postman.uint("noSpam");

                    /* mandatory fields */
                    const __ = req.locales.__;
                    if( values.name == "" ) messages.push( { title: __("Name required") } );
                    if( values.address == "" ) messages.push( { title: __("Address required") } );
                    if( values.telephone == "" ) messages.push( { title: __("Telephone number required") } );
                    if( values.email == "" ) messages.push( { title: __("Email required") } );
                    if( noSpam != "4" ) messages.push( { title: __("Spam-challange not correct, Hint: the result is") + " 4" } );

                    /* no errors -> create */
                    if( messages.length == 0 ) {
                        /* rearrange hotel prices */
                        var hotelPrices = {};
                        var extraDayPrices = {};

                        for( const hotel of prices.hotels ) {
                            for( const mode of hotel.modes )
                                hotelPrices[ mode.value ] = mode.complete;

                            for( const extraDay of hotel.extraDays || [] )
                                extraDayPrices[ extraDay.value ] = values.hotel.indexOf( "+Single" ) > 0 ? extraDay.single : extraDay.double;
                        }

                        /* calculate price */
                        var price = hotelPrices[ values.hotel ];

                        /* add extra days */
                        for( const extraDayName of extraDays )
                            price += extraDayPrices[ extraDayName ];

                        /* debug-display price */
                        console.log( "PRICE".bold.red, price );

                        values.price = price;

                        k.getData().guests.create( values, function( err ) {
                            if( err )
                                return next( err );

                            messages.push( { type: "success", title: __("Success"), text: prices.successTemplate({price}) } );
                            k.jade.render( req, res, "register", vals( req, { formatNumber: formatNumber, meeting: prices.meeting, hotels: prices.hotels, values: values, messages: messages, showForm: false }) );

                            const text = prices.emailTemplate( { prices, values, price, website: k.website } );

                            emailTransport.sendMail({
                                from: process.env.SMTP_USER,
                                to: values.email,
                                cc: prices.operatorEmail,
                                subject: `${prices.conference} Registration ${values.name}`,
                                text
                            }, function( err, data ){
                                if( err )
                                    return console.log( "EMAIL-ERROR:".bold.red, err );
                                console.log( "EMAIL-SUCCESS".bold.green );
                            });
                        });
                    }
                    else {
                        /* replace string by array */
                        values.extraDays = extraDays;
                        k.jade.render( req, res, "register", vals( req, { formatNumber: formatNumber, meeting: prices.meeting, hotels: prices.hotels, values: values, messages: messages, showForm: true }) );
                    }
                });
            });
        });

        /* session & program management */
        function secondsToTime( time, showSeconds = false ) {
            let s = time % 60; time -= s; time /= 60;
            let m = time % 60; time -= m; time /= 60;
            let h = time;

            if( s < 10 ) s = "0" + s;
            if( m < 10 ) m = "0" + m;
            if( h < 10 ) h = "0" + h;

            console.log( "secondsToTime", time, s, m, h);

            let text = `${h}:${m}`;
            if( showSeconds )
                text+= `:${s}`;
            return text;
        }

        async function sessionPresentations( req ) {
            return req.kern.db.pQuery(`
                SELECT *, TIME_TO_SEC( sessions.time ) AS daySeconds
                FROM sessions
                ORDER BY sessions.name, sessions.previousSession;
                SELECT presentations.*, guests.name AS guestName
                FROM presentations
                LEFT JOIN guests
                ON guests.id=presentations.guest
                ORDER BY presentations.number`)
            .then( ([ sessions, presentations ]) => {
                for( const session of sessions ) {
                    session.presentations = presentations.filter( p => p.session == session.id ).sort( p => p.number );

                    if( session.presentations.length )
                        session.durationSeconds = session.presentations.reduceRight( (sum, p) => sum + p.minutes * 60, 0 );
                    else
                        session.durationSeconds = 0;

                    /* avoid overwriting nextSession computed values */
                    if( session.previousSession == 0 ) {
                        session.isoDate = moment( session.date ).format("YYYY-MM-DD");
                        session.shortTime = session.time.substring( 0, 5 );
                    }

                    const nextSession = sessions.find( s => s.previousSession == session.id );
                    if( !nextSession )
                        continue;

                    /* create a linked list of all nextSessions */
                    session.nextSession = nextSession;
                    nextSession.daySeconds = session.daySeconds + session.durationSeconds + nextSession.pauseBefore*60;
                    nextSession.shortTime = secondsToTime( nextSession.daySeconds );
                    nextSession.breakTime = secondsToTime( session.daySeconds + session.durationSeconds );
                }
                return sessions
            });
        }

        async function computeMarkdown( req ) {
            const sessions = await sessionPresentations( req );

            /* read program markdown */
            let markdownProgram = await new Promise( (fulfill, reject ) => {
                k.readHierarchyFile( k.website, `/${viewYearPrefix}/program.md`, function( err, data ) {
                    if( err )
                        return reject( err );
                    fulfill( data[0] );
                })
            });

            /* apply inserted sessions */
            function markdownDaySessions( daySessions ) {
                let md = "";
                let lastSession;
                for( let daySession of daySessions )
                    while( true ) {
                        lastSession = daySession;
                        md+= `- ${daySession.shortTime} ${daySession.name}${daySession.onAir ? ' **on air**': ''}\n`
                        for( const presentation of daySession.presentations ) {
                            md += `  - ${presentation.guestName}: ${presentation.title} (${presentation.minutes}min)  \n`;
                            md += `    ${presentation.description.trim().replace(/\r?\n/g, "  \n    ")}\n`;
                        }

                        /* check for next sessions */
                        daySession = daySession.nextSession;
                        if( !daySession )
                            break;

                        md += `- ${daySession.breakTime} BioBreak\n`;
                    }

                /* remove trailing newline */
                if( md != "" ) {
                    const end = lastSession.daySeconds + lastSession.durationSeconds;
                    //md = md.substring( 0, md.length - 1 );
                    md+= `- ${secondsToTime(end)} `;
                }

                return md;
            }

            /* SESSIONS(YYYY-MM-DD): show all sessions of specific date */
            markdownProgram = markdownProgram.replace(/SESSIONS\(([0-9]{4}-[0-9]{2}-[0-9]{2})\)/g, (match, date) => {
                const daySessions = sessions.filter( s => s.isoDate == date );
                return markdownDaySessions( daySessions );
            });

            /* SESSION(<name>): show session with name */
            markdownProgram = markdownProgram.replace(/SESSION\(([-_ A-Za-z0-9]+)\)/g, (match, name) => {
                const namedSessions = sessions.filter( s => s.name == name );
                return markdownDaySessions( namedSessions );
            });

            return markdownProgram;
        }

        k.router.get("/program/markdown", async (req, res, next) => {
            try {
                const markdownProgram = await computeMarkdown( req );
                res.header( "Content-Type", "text/plain" );
                res.send( markdownProgram );
            } catch( err ) {
                next( err );
            }
        });

        async function renderProgram( req, res, next ) {
            try {
                let markdownProgram = await computeMarkdown( req );

                const guests = await req.kern.db.pQuery(`
                    SELECT *
                    FROM guests WHERE presentationTitle<>''
                    OR presentationDescription<>''
                    ORDER BY name ASC`);

                markdownProgram = marked( markdownProgram );
                k.jade.render( req, res, "program", vals( req, { markdownProgram, guests, year: prices.year }) );
            } catch ( err ) {
                next( err );
            }

        }

        k.router.get(["/program","/programm"], renderProgram);
        k.router.get("/readme", function( req, res, next ){
            k.readHierarchyFile( k.website, "README.md", function( err, data ) {
                if( err )
                    return next( err );

                res.send( marked( data[0] ) );
            });
        });

        /* obs browser-source helpers */
        k.useSiteModule( "/obs", k.website, "obs.js", { setup: {
            sessionPresentations
        } });

        k.router.get("/agenda", function( req, res, next ){
            k.readHierarchyFile( k.website, `/${viewYearPrefix}/agenda.md`, function( err, data ) {
                if( err )
                    return next( err );

                markdownAgenda = marked( data[0] );
                k.jade.render( req, res, "agenda", vals( req, { markdownAgenda: markdownAgenda, guests: data }) );
            });
        });

        k.router.get("/hotel-guests", function( req, res, next ){
            req.kern.db.query("SELECT * FROM guests ORDER BY hotel LIKE '%Room' DESC, hotel LIKE '%Double%' ASC, name ASC", [], function( err, data ) {
                if( err ) return next( err );

                const guests = [];
                for( const row of data ) {
                    var guest = {
                        name: row.name,
                        vip: row.vip,
                    };
                    for( const hotel of prices.hotels )
                        for( const mode of hotel.modes )
                            /* mode found, use this set */
                            if( mode.value == row.hotel ) {
                                /* hotel price & data */
                                Object.assign( guest, {
                                    header: hotel.header,
                                    mode: {
                                        name: mode.name.replace(/:\s*$/g, ''),
                                        single: mode.value.indexOf( "+Single" ) > 0
                                    },
                                    extraDays: []
                                });

                                if( !guest.mode.single )
                                    guest.partner = row.partnerName;

                                /* extra days */
                                for( const extraDay of hotel.extraDays || [] )
                                    if( row.extraDays.indexOf( extraDay.value ) >= 0 )
                                        guest.extraDays.push( extraDay.name );
                            }

                    guests.push( guest );
                }

                k.jade.render( req, res, "hotelGuests", vals( req, { guests: guests }) );
            });
	});

	k.router.get("/presentations", function( req, res, next ){
            req.kern.db.query("SELECT * FROM guests ORDER BY name ASC", [], function( err, data ) {
                if( err ) return next( err );

                k.jade.render( req, res, "presentations", vals( req, { guests: data }) );
            });
	});

	k.router.get("/guests", function( req, res, next ){
            req.kern.db.query("SELECT * FROM guests ORDER BY name ASC", [], function( err, data ) {
                if( err ) return next( err );

                k.jade.render( req, res, "guests", vals( req, { guests: data }) );
            });
	});
        
        function renderMain( req, res, next, opts ) {
            updateDates();
            if( opts && opts.preview )
                prices.meeting.registrationActive = true;

            if( prices.meeting.programActive )
                return renderProgram( req, res, next );

            k.readHierarchyFile( k.website, `/${viewYearPrefix}/intro.md`, function( err, data ) {
                if( err )
                    return next( err )

                var markdownIntro = marked( data[0] );
                markdownIntro = markdownIntro.replace(/REGISTERBUTTON/g, prices.meeting.registrationActive ? `<a class="btn btn-primary btn-lg" href="#register">${prices.registerButton}</a>` : '' );

                k.jade.render( req, res, "register", vals( req, { markdownIntro: markdownIntro, formatNumber: formatNumber, meeting: prices.meeting, hotels: prices.hotels, values: { meeting: "meeting", hotel: "Keines", partner: "Kein" }, showForm: true,
                    conference: prices.conference,
                    myName: prices.myName,
                    year: prices.year,
                    messages: [] } ) );
            });
        }

        k.router.get("/preview", function( req, res, next ) {
            renderMain( req, res, next, { preview: true } );
	});

        /* render previous conferences */
        k.router.get("/20[0-9]{2}(i[0-9]+)?", function( req, res, next ) {
            const year = k.filters.id( req.path );

            k.hierarchy.readHierarchyTree( req.kern.website, "/views", { foldersOnly: false }, ( err, tree ) => {
                if( err ) return next( err );
                if( !(year in tree.dirs) )
                    return res.redirect( "/" );

                /* intro */
                k.readHierarchyFile( req.kern.website, `/views/${year}/intro.md`, function( err, data ) {
                    if( err ) return next( err )

                    var markdownIntro = marked( data[0] );
                    markdownIntro = markdownIntro.replace(/REGISTERBUTTON/g, '<h2 class="section">Invitation section</h2>');
                
                    /* program */
                    k.readHierarchyFile( req.kern.website, `/views/${year}/program.md`, function( err, data ) {
                        var markdownProgram = "";
                        if( !err )
                            markdownProgram = marked( data[0] );

                        /* presentations */
                        k.readHierarchyFile( req.kern.website, `/views/${year}/presentations.html`, function( err, data ) {
                            var htmlPresentations = "";
                            if( !err )
                                htmlPresentations = data[0];

                            k.jade.render( req, res, "previous", vals( req, {
                                conference: prices.conference,
                                year: year,
                                markdownIntro: markdownIntro,
                                markdownProgram: markdownProgram,
                                htmlPresentations: htmlPresentations
                            }));
                        });
                    });
                });
            });
        });

        k.router.get("/", function( req, res, next ) {
            renderMain( req, res, next );
	});
    }
};
