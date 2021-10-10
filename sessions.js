// Sessions SQL CRUD
// (c)copyright 2021 by Gerald Wodni <gerald.wodni@gmail.com>

module.exports = {
    setup: function( k ) {
        const db = k.getDb();
        const kData = k.getData();

        k.crud.presenter( k, kData.sessions, {
            
            title: "Session",
            path: "/admin/sessions",

            fields: {
                name:       { text: "Name",         type: "text" },
                date:       { text: "Date",         type: "date" }, /* todo: implement datetime */
                time:       { text: "Time",         type: "text" }, /* todo: implement time */
                pauseBefore:{ text: "Pause before", type: "number" },
                previousSession: { text: "Previous session",        type: "foreign" },
            }

        });
    }
};
