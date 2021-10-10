// Presentations SQL CRUD
// (c)copyright 2021 by Gerald Wodni <gerald.wodni@gmail.com>

const jadeFile = "admin/presentations";

module.exports = {
    setup: function( k ) {
        const db = k.getDb();
        const kData = k.getData();

        k.router.get("/set-active/:id", (req, res, next) => {
            const id = req.requestman.id();
            k.rdb.set( `${req.kern.website}:active-presentation`, id, err => {
                if( err )
                    return res.json( { error: err } );
                res.json( { success: true } );
            });
        });

        k.router.get("/get-active", (req, res, next) => {
            k.rdb.get( `${req.kern.website}:active-presentation`, (err, data) => {
                if( err )
                    return res.json( { error: err } );
                res.json( { success: true, id: data } );
            });
        });

        k.router.get("/read-from-guests", function( req, res, next ) {
            req.kern.db.pQuery(`
                SELECT
                    id,
                    presentationTitle AS title,
                    presentationLength AS length,
                    presentationDescription AS description
                FROM guests
                WHERE TRIM(presentationTitle) <> ''
                ORDER BY id;

                SELECT * FROM presentations`)
            /* match programatically */
            .then( ([ guests, presentations ]) => {
                const defaultLength = req.kern.getWebsiteConfig("presentation.defaultLength", 40);

                /* TODO: delete unmatched? */
                const queries = [];
                function update( guest, presentation ) {
                    guest.minutes = k.filters.uint( guest.length )
                    if( guest.minutes == "" )
                        guest.minutes = defaultLength;
                    if( presentation == null )
                        queries.push( req.kern.db.pQuery( `
                            INSERT INTO presentations (title, minutes, guest, description)
                            VALUES ( {title}, {minutes}, {id}, {description} )`, guest ) );
                    else
                        queries.push( req.kern.db.pQuery( `
                            UPDATE presentations
                            SET title={title}, minutes={minutes}, description={description}
                            WHERE id={presentationId}`, Object.assign( { presentationId: presentation.id }, guest ) ) );
                }

                for( guest of guests ) {
                    const titles = guest.title.split("|");
                    if( titles.length == 1 ) {
                        /* simple matching */
                        update( guest, presentations.find( p => p.guest == guest.id ) )
                    }
                    else {
                        /* match by lower id */
                        const descriptions = guest.description.split("|");
                        const lengths = guest.length.split("|");
                        const guestPresentations = presentations.filter( p => p.guest == guest.id );
                        for( var i = 0; i < titles.length; i++ )
                            update( {
                                id: guest.id,
                                title: titles[i],
                                length: i < lengths.length ? lengths[i] : defaultLength,
                                description: i < descriptions.length ? descriptions[i] : "",
                            }, i < guestPresentations.length ? guestPresentations[i] : null );
                    }
                }

                return Promise.all( queries );
            })
            .then( () => {
                const messages = [{type: "success", title:"Synced", text: "Presentations have been updated from guest data"}];
                k.jade.render( req, res, jadeFile, k.reg("admin").values( req, {
                    title: "Presentations", opts: {
                        scripts: [],
                        scriptModules: [],
                    },
                    messages,
                } ) );
            })
            .catch( next );
        });

        k.crud.presenter( k, kData.presentations, {
            
            title: "Presentations",
            path: "/admin/presentations",
            scriptModules: [ "/js/presentations.js" ],
            jadeFile,

            fields: {
                title:      { text: "Title",        type: "text" },
                session:    { text: "Session",      type: "foreign" },
                number:     { text: "Number",       type: "number" },
                minutes:    { text: "Minutes",      type: "number" },
                guest:      { text: "Guest",        type: "foreign" },
                description:{ text: "Description",  type: "textarea" },
            }

        });
    }
};
