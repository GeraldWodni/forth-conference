module.exports = {
    setup: function( k ) {

        const connection = k.getDb();

        const guests = k.crud.sql( connection, { table: "guests", foreignBoldName: "state", foreignName: "name" } );
        const sessions = k.crud.sql( connection, { table: "sessions", foreignBoldName: "previousSessionName", foreignName: "name",
            foreignNameSeparator: " > ",
            selectListQuery: { sql: `
                SELECT sessions.id, sessions.name, previousSessions.name AS previousSessionName
                FROM sessions
                LEFT JOIN sessions AS previousSessions
                ON previousSessions.id=sessions.previousSession
                ORDER BY sessions.name
                `
            },
            foreignKeys: {
                previousSession: { crud: null }
            },
        } );
        sessions.foreignKeys.previousSession.crud = sessions;
        const presentations = k.crud.sql( connection, { table: "presentations", foreignBoldName: "session", foreignName: "title",
            selectListQuery: { sql: `
                SELECT
                    presentations.id,
                    CONCAT( guests.name, ' - ', presentations.title ) AS title,
                    CONCAT( COALESCE(sessions.name, '<none>'), ':', presentations.number, ' (', presentations.minutes, 'min)' ) AS session
                FROM presentations
                LEFT JOIN guests
                ON guests.id=presentations.guest
                LEFT JOIN sessions
                ON sessions.id=presentations.session
                ORDER BY sessions.name, presentations.number, guests.name, presentations.title
                `
            },
            foreignKeys: {
                guest:   { crud: guests },
                session: { crud: sessions },
            }
        } );

        return {
            guests,
            presentations,
            sessions,
        };
    }
}
